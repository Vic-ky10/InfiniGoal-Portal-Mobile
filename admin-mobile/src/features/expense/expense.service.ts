import { supabase } from "@/lib/supabase/client";
import { createNotification, notifyAdmins } from "@/features/notification";

import {
  EXPENSE_STATUS,
  PAYMENT_STATUS,
  Expense,
  ExpenseFilters,
  ExpenseWithEmployee,
} from "./expense.types";

import {
  ExpenseInput,
  UpdateExpenseInput,
  ReviewExpenseInput,
} from "./expense.validation";

const EXPENSE_CODE_PREFIX = "EXP";

function formatExpenseCode(value: number) {
  return `${EXPENSE_CODE_PREFIX}${value.toString().padStart(6, "0")}`;
}

const EXPENSE_SELECT = `
id,
profile_id,
expense_code,
expense_type,
amount,
approved_amount,
currency,
description,
receipt_url,
expense_date,
status,
payment_status,
reviewed_by,
reviewed_at,
review_comment,
created_at,
updated_at
`;

const EXPENSE_WITH_EMPLOYEE_SELECT = `
id,
profile_id,
expense_code,
expense_type,
amount,
approved_amount,
currency,
description,
receipt_url,
expense_date,
status,
payment_status,
review_comment,
reviewed_by,
reviewed_at,
created_at,
updated_at,
employee:profiles!expenses_profile_id_fkey(
employee_id,
full_name,
email,
department,
designation
)
`;

export async function getAuthenticatedProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function generateExpenseCode(): Promise<string> {
  const { data, error } = await supabase
    .from("expenses")
    .select("expense_code");

    console.log("All expense codes visible to app:", data);

  if (error) {
    throw new Error("Unable to generate expense code.");
  }

  if (!data || data.length === 0) {
    return "EXP000001";
  }

  const maxNumber = Math.max(
    ...data.map((item) =>
      parseInt(item.expense_code.replace("EXP", ""), 10)
    )
  );

  return `EXP${String(maxNumber + 1).padStart(6, "0")}`;
}

export async function createExpense(
  profileId: string,
  values: ExpenseInput
) {
  const expenseCode = await generateExpenseCode();
  console.log("Generated Expense Code:", expenseCode);

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      profile_id: profileId,
      expense_code: expenseCode,
      expense_type: values.expense_type,
      amount: values.amount,
      currency: "INR",
      description: values.description,
      receipt_url: values.receipt_url ?? null,
      expense_date: values.expense_date,
      status: EXPENSE_STATUS.PENDING,
      payment_status: PAYMENT_STATUS.PENDING,
      approved_amount: null,
      reviewed_by: null,
      reviewed_at: null,
      review_comment: null,
    })
    .select(EXPENSE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  await notifyAdmins({
    title: "New Expense Submission",
    message: `Expense claim of ₹${values.amount} (${values.expense_type}) submitted.`,
    notificationType: "EXPENSE_SUBMISSION",
    referenceId: data.id,
    actionUrl: "/(admin)/expenses",
    createdBy: profileId,
  });

  return {
    success: true,
    message: "Expense submitted successfully.",
    data: data as Expense,
  };
}

export async function updateExpense(
  expenseId: string,
  profileId: string,
  values: UpdateExpenseInput
) {
  const { data: existingExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("id, profile_id, status")
    .eq("id", expenseId)
    .single();

  if (fetchError) {
    return {
      success: false,
      error: fetchError.message,
    };
  }

  if (!existingExpense) {
    return {
      success: false,
      error: "Expense not found.",
    };
  }

  if (existingExpense.profile_id !== profileId) {
    return {
      success: false,
      error: "You are not allowed to update this expense.",
    };
  }

  if (existingExpense.status !== EXPENSE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending expenses can be updated.",
    };
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      expense_type: values.expense_type,
      amount: values.amount,
      description: values.description,
      receipt_url: values.receipt_url ?? null,
      expense_date: values.expense_date,
    })
    .eq("id", expenseId)
    .select(EXPENSE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Expense updated successfully.",
    data: data as Expense,
  };
}

export async function getEmployeeExpenses(
  profileId: string,
  filters: ExpenseFilters = {}
): Promise<Expense[]> {
  let query = supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data as Expense[];
}

export async function getExpenses(
  filters: ExpenseFilters = {}
): Promise<ExpenseWithEmployee[]> {
  let query = supabase
    .from("expenses")
    .select(EXPENSE_WITH_EMPLOYEE_SELECT)
    .order("created_at", { ascending: false });

  if (filters.profileId) {
    query = query.eq("profile_id", filters.profileId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (data as SupabaseExpenseRecord[]).map((record) => ({
    ...record,
    employee: Array.isArray(record.employee)
      ? record.employee[0] ?? null
      : record.employee,
  }));
}

async function getExpenseById(id: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Expense | null;
}

export async function deletePendingExpense(
  profileId: string,
  expenseId: string
) {
  const existing = await getExpenseById(expenseId);

  if (!existing || existing.profile_id !== profileId) {
    return {
      success: false,
      error: "Expense was not found.",
    };
  }

  if (existing.status !== EXPENSE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending expenses can be deleted.",
    };
  }

  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("profile_id", profileId)
    .eq("status", EXPENSE_STATUS.PENDING)
    .select(EXPENSE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Expense deleted successfully.",
    data: data as Expense,
  };
}

export async function reviewExpense(
  reviewerId: string,
  values: ReviewExpenseInput
) {
  const existing = await getExpenseById(values.expenseId);

  if (!existing) {
    return {
      success: false,
      error: "Expense was not found.",
    };
  }

  if (existing.status !== EXPENSE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending expenses can be reviewed.",
    };
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      status: values.status,
      approved_amount: values.approved_amount,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comment: values.review_comment ?? null,
    })
    .eq("id", values.expenseId)
    .eq("status", EXPENSE_STATUS.PENDING)
    .select(EXPENSE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  await createNotification({
    profileId: existing.profile_id,
    title:
      values.status === EXPENSE_STATUS.APPROVED
        ? "Expense Claim Approved"
        : "Expense Claim Rejected",
    message: `Your expense claim (${existing.expense_code}) for ₹${
      values.approved_amount ?? existing.amount
    } has been ${values.status.toLowerCase()}.${
      values.review_comment ? ` Comment: ${values.review_comment}` : ""
    }`,
    notificationType:
      values.status === EXPENSE_STATUS.APPROVED
        ? "EXPENSE_APPROVED"
        : "EXPENSE_REJECTED",
    referenceId: existing.id,
    actionUrl: "/(employee)/expenses",
    createdBy: reviewerId,
  });

  return {
    success: true,
    message: `Expense ${values.status.toLowerCase()} successfully.`,
    data: data as Expense,
  };
}

export async function markExpensePaid(
  expenseId: string
) {
  const existing = await getExpenseById(expenseId);

  if (!existing) {
    return {
      success: false,
      error: "Expense was not found.",
    };
  }

  if (existing.status !== EXPENSE_STATUS.APPROVED) {
    return {
      success: false,
      error: "Only approved expenses can be marked as paid.",
    };
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      payment_status: PAYMENT_STATUS.PAID,
    })
    .eq("id", expenseId)
    .eq("status", EXPENSE_STATUS.APPROVED)
    .select(EXPENSE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Expense marked as paid.",
    data: data as Expense,
  };
}

type SupabaseExpenseRecord = ExpenseWithEmployee & {
  employee:
    | ExpenseWithEmployee["employee"]
    | NonNullable<ExpenseWithEmployee["employee"]>[];
};