import { supabase } from "@/lib/supabase/client";
import { CODE_PADDING, PURCHASE_PREFIX } from "./sales.constants";
import { CustomerPurchase, IncentiveRule, PurchaseRemarksMeta } from "./sales.types";
import { CustomerPurchaseForm } from "./sales.validation";
import { createNotification, notifyAdmins } from "@/features/notification";
import { parsePurchaseRemarks, serializePurchaseRemarks } from "./sales.utils";
import { ServiceResponse } from "./customer.service";

const CUSTOMER_PURCHASE_SELECT =
  "id, purchase_code, customer_id, amount, purchase_date, incentive_amount, status, remarks, created_by, created_at, updated_at";

export async function getCustomerPurchases(): Promise<CustomerPurchase[]> {
  const { data, error } = await supabase
    .from("customer_purchases")
    .select(CUSTOMER_PURCHASE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Customer Purchases Error:", error.message);
    return [];
  }

  return data as CustomerPurchase[];
}

export async function getCustomerPurchaseById(id: string): Promise<CustomerPurchase | null> {
  const { data, error } = await supabase
    .from("customer_purchases")
    .select(CUSTOMER_PURCHASE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get Customer Purchase By ID Error:", error.message);
    return null;
  }

  return data as CustomerPurchase | null;
}

export async function generatePurchaseCode(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_next_purchase_code");

  if (error) {
    throw new Error("Unable to generate purchase code: " + error.message);
  }

  return data as string;
}

async function getActiveIncentiveRule(): Promise<IncentiveRule | null> {
  const { data, error } = await supabase
    .from("incentive_rules")
    .select("*")
    .eq("status", "Active")
    .order("minimum_purchase", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as IncentiveRule | null;
}

async function getActionUrlForRecipient(
  recipientProfileId: string,
  purchaseId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", recipientProfileId)
    .maybeSingle();

  const role = profile?.role || "Employee";
  if (role === "Admin") {
    return `/sales?purchaseId=${purchaseId}`;
  } else {
    return `/employee/sales?purchaseId=${purchaseId}`;
  }
}

export async function createCustomerPurchase(
  purchase: CustomerPurchaseForm,
  createdBy: string
): Promise<ServiceResponse<CustomerPurchase>> {
  try {
    const purchaseCode = await generatePurchaseCode();
    const rule = await getActiveIncentiveRule();

    let incentiveAmount = 0;
    let incentiveStatus: PurchaseRemarksMeta["incentive_status"] = "Not Eligible";

    if (rule && purchase.amount >= rule.minimum_purchase) {
      incentiveAmount = rule.incentive_amount;
      incentiveStatus = "Pending Review";
    }

    const purchaseStatus = "Pending";

    const remarksJson = serializePurchaseRemarks({
      incentive_status: incentiveStatus,
      remarks: purchase.remarks || "",
    });

    const { data, error } = await supabase
      .from("customer_purchases")
      .insert({
        purchase_code: purchaseCode,
        customer_id: purchase.customer_id,
        amount: purchase.amount,
        purchase_date: purchase.purchase_date,
        incentive_amount: incentiveAmount,
        status: purchaseStatus,
        remarks: remarksJson,
        created_by: createdBy,
      })
      .select(CUSTOMER_PURCHASE_SELECT)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const newPurchase = data as CustomerPurchase;

    if (incentiveStatus === "Pending Review") {
      const { data: customer } = await supabase
        .from("customers")
        .select("full_name, assigned_employee_id")
        .eq("id", purchase.customer_id)
        .maybeSingle();

      const customerName = customer?.full_name || "Customer";
      const employeeId = customer?.assigned_employee_id || createdBy;

      const { data: employee } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", employeeId)
        .maybeSingle();

      const employeeName = employee?.full_name || "Employee";

      await notifyAdmins({
        title: "Incentive Eligibility Review Required",
        message: `Employee ${employeeName} has become eligible for an incentive.\nPurchase: ${purchaseCode}\nCustomer: ${customerName}\nPurchase Amount: ₹${purchase.amount.toLocaleString("en-IN")}\nPlease review.`,
        notificationType: "General",
        referenceId: newPurchase.id,
        actionUrl: `/sales?purchaseId=${newPurchase.id}`,
        createdBy: employeeId,
      });
    }

    return {
      success: true,
      message: "Customer purchase created successfully.",
      data: newPurchase,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to record customer purchase.",
    };
  }
}

export async function updateCustomerPurchase(
  id: string,
  purchase: CustomerPurchaseForm & { status?: string; incentive_status?: string },
  adminReviewedBy?: string
): Promise<ServiceResponse<CustomerPurchase>> {
  try {
    const existing = await getCustomerPurchaseById(id);
    if (!existing) {
      return {
        success: false,
        error: "Purchase not found.",
      };
    }

    const existingMeta = parsePurchaseRemarks(existing.remarks, existing.status);

    const purchaseStatus = purchase.status || existing.status;
    let incentiveStatus = purchase.incentive_status || existingMeta.incentive_status;
    let incentiveAmount = existing.incentive_amount;

    if (purchase.amount !== existing.amount && !purchase.incentive_status) {
      const rule = await getActiveIncentiveRule();
      if (rule && purchase.amount >= rule.minimum_purchase) {
        incentiveAmount = rule.incentive_amount;
        if (incentiveStatus === "Not Eligible" || incentiveStatus === "Eligible") {
          incentiveStatus = "Pending Review";
        }
      } else {
        incentiveAmount = 0;
        incentiveStatus = "Not Eligible";
      }
    } else if (purchase.incentive_status) {
      const rule = await getActiveIncentiveRule();
      if (incentiveStatus === "Not Eligible") {
        incentiveAmount = 0;
      } else if (rule && incentiveAmount === 0) {
        incentiveAmount = rule.incentive_amount;
      }
    }

    const remarksJson = serializePurchaseRemarks({
      incentive_status: incentiveStatus as any,
      remarks: purchase.remarks || "",
    });

    const { data, error } = await supabase
      .from("customer_purchases")
      .update({
        customer_id: purchase.customer_id,
        amount: purchase.amount,
        purchase_date: purchase.purchase_date,
        incentive_amount: incentiveAmount,
        status: purchaseStatus,
        remarks: remarksJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(CUSTOMER_PURCHASE_SELECT)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const updatedPurchase = data as CustomerPurchase;

    const wasPendingReview = existingMeta.incentive_status === "Pending Review";
    const isNowPendingReview = incentiveStatus === "Pending Review";

    const { data: customerInfo } = await supabase
      .from("customers")
      .select("full_name, assigned_employee_id")
      .eq("id", purchase.customer_id)
      .maybeSingle();

    const customerName = customerInfo?.full_name || "Customer";
    const employeeId = customerInfo?.assigned_employee_id || existing.created_by;

    if (isNowPendingReview && !wasPendingReview) {
      const { data: employeeInfo } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", employeeId)
        .maybeSingle();

      const employeeName = employeeInfo?.full_name || "Employee";

      await notifyAdmins({
        title: "Incentive Eligibility Review Required",
        message: `Employee ${employeeName} has become eligible for an incentive.\nPurchase: ${existing.purchase_code}\nCustomer: ${customerName}\nPurchase Amount: ₹${purchase.amount.toLocaleString("en-IN")}\nPlease review.`,
        notificationType: "General",
        referenceId: id,
        actionUrl: `/sales?purchaseId=${id}`,
        createdBy: employeeId,
      });
    }

    const { data: existingIncentive } = await supabase
      .from("incentives")
      .select("id")
      .eq("title", `Incentive for Purchase ${existing.purchase_code}`)
      .maybeSingle();

    if (incentiveStatus === "Approved" && !existingIncentive) {
      const { generateIncentiveCode } = await import("../incentive/incentive.service");
      const incentiveCode = await generateIncentiveCode();

      await supabase.from("incentives").insert({
        profile_id: employeeId,
        incentive_code: incentiveCode,
        incentive_type: "Customer Conversion",
        title: `Incentive for Purchase ${existing.purchase_code}`,
        description: `Incentive earned from purchase ${existing.purchase_code}`,
        amount: incentiveAmount,
        month: new Date(purchase.purchase_date).getMonth(),
        year: new Date(purchase.purchase_date).getFullYear(),
        status: "Approved",
        payment_status: "Pending",
        approved_by: adminReviewedBy || null,
        approved_at: new Date().toISOString(),
        created_by: adminReviewedBy || null,
      });
    } else if (existingIncentive) {
      let newIncentiveStatus = "Pending";
      if (incentiveStatus === "Approved") newIncentiveStatus = "Approved";
      else if (incentiveStatus === "Rejected") newIncentiveStatus = "Rejected";
      
      await supabase.from("incentives").update({
        amount: incentiveAmount,
        status: newIncentiveStatus,
        month: new Date(purchase.purchase_date).getMonth(),
        year: new Date(purchase.purchase_date).getFullYear(),
      }).eq("id", existingIncentive.id);
    }

    const isStatusChanged = incentiveStatus !== existingMeta.incentive_status;
    if (isStatusChanged && (incentiveStatus === "Approved" || incentiveStatus === "Rejected")) {
      const msg = incentiveStatus === "Approved"
        ? "✅ Your incentive has been approved."
        : "❌ Your incentive request has been rejected.";

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", employeeId)
        .maybeSingle();

      if (ownerProfile && ownerProfile.role !== "Admin") {
        const actionUrl = await getActionUrlForRecipient(employeeId, id);
        await createNotification({
          profileId: employeeId,
          title: `Incentive Eligibility ${incentiveStatus}`,
          message: msg,
          notificationType: "General",
          referenceId: id,
          actionUrl,
          createdBy: adminReviewedBy,
        });
      }
    }

    return {
      success: true,
      message: "Customer purchase updated successfully.",
      data: updatedPurchase,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to update purchase.",
    };
  }
}

export async function deleteCustomerPurchase(id: string): Promise<ServiceResponse> {
  const { error } = await supabase
    .from("customer_purchases")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Customer purchase deleted successfully.",
  };
}

function formatPurchaseCode(value: number) {
  return `${PURCHASE_PREFIX}${String(value).padStart(CODE_PADDING, "0")}`;
}
