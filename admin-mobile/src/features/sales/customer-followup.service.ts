import { supabase } from "@/lib/supabase/client";
import { CustomerFollowup } from "./sales.types";
import { CustomerFollowupForm } from "./sales.validation";
import { ServiceResponse } from "./customer.service";

const CUSTOMER_FOLLOWUP_SELECT =
  "id, customer_id, followup_date, followup_type, remarks, next_followup_date, created_by, created_at";

export async function getCustomerFollowups(): Promise<CustomerFollowup[]> {
  const { data, error } = await supabase
    .from("customer_followups")
    .select(CUSTOMER_FOLLOWUP_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Customer Followups Error:", error.message);
    return [];
  }

  return data as CustomerFollowup[];
}

export async function getCustomerFollowupById(id: string): Promise<CustomerFollowup | null> {
  const { data, error } = await supabase
    .from("customer_followups")
    .select(CUSTOMER_FOLLOWUP_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get Customer Followup Error:", error.message);
    return null;
  }

  return data as CustomerFollowup | null;
}

export async function createCustomerFollowup(
  followup: CustomerFollowupForm,
  createdBy: string
): Promise<ServiceResponse<CustomerFollowup>> {
  const { data, error } = await supabase
    .from("customer_followups")
    .insert({
      customer_id: followup.customer_id,
      followup_date: followup.followup_date || new Date().toISOString(),
      followup_type: followup.followup_type,
      remarks: followup.remarks || null,
      next_followup_date: followup.next_followup_date || null,
      created_by: createdBy,
    })
    .select(CUSTOMER_FOLLOWUP_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Customer follow-up created successfully.",
    data: data as CustomerFollowup,
  };
}

export async function updateCustomerFollowup(
  id: string,
  followup: CustomerFollowupForm
): Promise<ServiceResponse<CustomerFollowup>> {
  const { data, error } = await supabase
    .from("customer_followups")
    .update({
      customer_id: followup.customer_id,
      followup_date: followup.followup_date || new Date().toISOString(),
      followup_type: followup.followup_type,
      remarks: followup.remarks || null,
      next_followup_date: followup.next_followup_date || null,
    })
    .eq("id", id)
    .select(CUSTOMER_FOLLOWUP_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Customer follow-up updated successfully.",
    data: data as CustomerFollowup,
  };
}

export async function deleteCustomerFollowup(id: string): Promise<ServiceResponse> {
  const { error } = await supabase
    .from("customer_followups")
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
    message: "Customer follow-up deleted successfully.",
  };
}
