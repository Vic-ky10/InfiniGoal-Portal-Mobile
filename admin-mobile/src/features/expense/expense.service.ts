import { supabase } from "@/lib/supabase/client";
import { createNotification, notifyAdmins } from "@/features/notification";

import {
  EXPENSE_CATEGORY,
  EXPENSE_STATUS,
  PAYMENT_STATUS,
  Expense,
  ExpenseFilters,
  ExpenseWithEmployee,
  AdminExpenseSummary,
  EmployeeExpenseSummary,
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
receipt_name,
receipt_size,
receipt_type,
uploaded_at,
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
receipt_name,
receipt_size,
receipt_type,
uploaded_at,
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
  // const expenseCode = await generateExpenseCode();
  // console.log("Generated Expense Code:", expenseCode);
const { data, error } = await supabase
  .from("expenses")
  .insert({
    profile_id: profileId,
    expense_type: values.expense_type,
    amount: values.amount,
    currency: "INR",
    description: values.description,
    receipt_url: values.receipt_url ?? null,
    receipt_name: values.receipt_name ?? null,
    receipt_size: values.receipt_size ?? null,
    receipt_type: values.receipt_type ?? null,
    uploaded_at: values.receipt_url ? (values.uploaded_at ?? new Date().toISOString()) : null,
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
    notificationType: "Expense",
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
      receipt_name: values.receipt_name ?? null,
      receipt_size: values.receipt_size ?? null,
      receipt_type: values.receipt_type ?? null,
      uploaded_at: values.receipt_url ? (values.uploaded_at ?? new Date().toISOString()) : null,
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
    notificationType: "Expense",
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

export async function getAdminExpenseSummary(): Promise<AdminExpenseSummary> {
  const expenses = await getExpenses();

  let totalCompanyExpense = 0;
  let approvedAmount = 0;
  let pendingAmount = 0;
  let rejectedAmount = 0;

  const uniqueProfiles = new Set<string>();
  const topEmployeesMap: Record<
    string,
    {
      profileId: string;
      name: string;
      email: string;
      totalAmount: number;
      count: number;
    }
  > = {};
  const deptMap: Record<
    string,
    { department: string; totalAmount: number; count: number }
  > = {};
  const monthlyMap: Record<
    string,
    { month: string; amount: number; count: number }
  > = {};

  expenses.forEach((expense) => {
    totalCompanyExpense += expense.amount;
    uniqueProfiles.add(expense.profile_id);

    if (expense.status === EXPENSE_STATUS.APPROVED) {
      approvedAmount += expense.approved_amount ?? expense.amount;
    } else if (expense.status === EXPENSE_STATUS.PENDING) {
      pendingAmount += expense.amount;
    } else if (expense.status === EXPENSE_STATUS.REJECTED) {
      rejectedAmount += expense.amount;
    }

    // Top employees aggregation
    const pId = expense.profile_id;
    if (!topEmployeesMap[pId]) {
      topEmployeesMap[pId] = {
        profileId: pId,
        name: expense.employee?.full_name ?? "Unknown",
        email: expense.employee?.email ?? "",
        totalAmount: 0,
        count: 0,
      };
    }
    topEmployeesMap[pId].totalAmount += expense.amount;
    topEmployeesMap[pId].count += 1;

    const dept = expense.employee?.department || "Other";
    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        totalAmount: 0,
        count: 0,
      };
    }
    deptMap[dept].totalAmount += expense.amount;
    deptMap[dept].count += 1;

    if (expense.expense_date) {
      const monthKey = expense.expense_date.substring(0, 7); // e.g. "2026-07"
      if (monthKey && monthKey.length === 7) {
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthKey,
            amount: 0,
            count: 0,
          };
        }
        monthlyMap[monthKey].amount += expense.amount;
        monthlyMap[monthKey].count += 1;
      }
    }
  });

  const totalExpenseCount = expenses.length;
  const employeeCount = uniqueProfiles.size;
  const averageExpense =
    totalExpenseCount > 0 ? totalCompanyExpense / totalExpenseCount : 0;

  const topEmployees = Object.values(topEmployeesMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const departmentSummary = Object.values(deptMap);

  const monthlySummary = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const recentExpenses = expenses.slice(0, 5);

  return {
    totalCompanyExpense,
    approvedAmount,
    pendingAmount,
    rejectedAmount,
    totalExpenseCount,
    employeeCount,
    averageExpense,
    topEmployees,
    departmentSummary,
    monthlySummary,
    recentExpenses,
  };
}

export async function getEmployeeExpenseSummary(profileId?: string): Promise<EmployeeExpenseSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: User session not found.");
  }
  const activeProfileId = profileId || user.id;

  const expenses = await getEmployeeExpenses(activeProfileId);

  let totalExpenses = 0;
  let approvedAmount = 0;
  let pendingAmount = 0;
  let rejectedAmount = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let monthlyTotal = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const categoryMap: Record<
    string,
    { category: string; amount: number; count: number }
  > = {};
  
  // Populate categories
  Object.values(EXPENSE_CATEGORY).forEach((cat) => {
    categoryMap[cat] = { category: cat, amount: 0, count: 0 };
  });

  const monthlyMap: Record<
    string,
    { month: string; amount: number; count: number }
  > = {};

  expenses.forEach((expense) => {
    totalExpenses += expense.amount;

    if (expense.status === EXPENSE_STATUS.APPROVED) {
      approvedAmount += expense.approved_amount ?? expense.amount;
      approvedCount += 1;
    } else if (expense.status === EXPENSE_STATUS.PENDING) {
      pendingAmount += expense.amount;
      pendingCount += 1;
    } else if (expense.status === EXPENSE_STATUS.REJECTED) {
      rejectedAmount += expense.amount;
      rejectedCount += 1;
    }

    const expDate = new Date(expense.expense_date);
    if (
      expDate.getFullYear() === currentYear &&
      expDate.getMonth() === currentMonth
    ) {
      monthlyTotal += expense.amount;
    }

    // Monthly aggregation (YYYY-MM)
    if (expense.expense_date) {
      const monthKey = expense.expense_date.substring(0, 7); // e.g. "2026-07"
      if (monthKey && monthKey.length === 7) {
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthKey,
            amount: 0,
            count: 0,
          };
        }
        monthlyMap[monthKey].amount += expense.amount;
        monthlyMap[monthKey].count += 1;
      }
    }

    const cat = expense.expense_type;
    if (cat) {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, amount: 0, count: 0 };
      }
      categoryMap[cat].amount += expense.amount;
      categoryMap[cat].count += 1;
    }
  });

  const totalExpenseCount = expenses.length;
  const averageExpense =
    totalExpenseCount > 0 ? totalExpenses / totalExpenseCount : 0;
  const categorySummary = Object.values(categoryMap);
  const monthlySummary = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  const recentExpenses = expenses.slice(0, 5);

  return {
    totalExpenses,
    approvedAmount,
    pendingAmount,
    rejectedAmount,
    totalExpenseCount,
    approvedCount,
    pendingCount,
    rejectedCount,
    monthlyTotal,
    averageExpense,
    categorySummary,
    monthlySummary,
    recentExpenses,
  };
}

export interface ExpenseCashOut {
  id: string;
  profile_id: string;
  amount: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getEmployeeCashOuts(profileId: string): Promise<ExpenseCashOut[]> {
  const { data, error } = await supabase
    .from("expense_cash_outs")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching employee cash outs:", error);
    return [];
  }
  return data as ExpenseCashOut[];
}

export async function getAllCashOuts(): Promise<ExpenseCashOut[]> {
  const { data, error } = await supabase
    .from("expense_cash_outs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all cash outs:", error);
    return [];
  }
  return data as ExpenseCashOut[];
}

export async function createCashOut(
  profileId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; error?: string; data?: ExpenseCashOut }> {
  const { data, error } = await supabase
    .from("expense_cash_outs")
    .insert({
      profile_id: profileId,
      amount,
      description: description || null,
    })
    .select("*")
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data: data as ExpenseCashOut,
  };
}