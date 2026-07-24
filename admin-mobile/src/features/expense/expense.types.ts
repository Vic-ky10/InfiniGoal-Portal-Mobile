import z from "zod";

export type ExpenseCategory =
  (typeof EXPENSE_CATEGORY)[keyof typeof EXPENSE_CATEGORY];

export type ExpenseStatus =
  (typeof EXPENSE_STATUS)[keyof typeof EXPENSE_STATUS];

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];


export const EXPENSE_CATEGORY = {
  FOOD: "Food",
  ACCOMMODATION: "Accommodation",
  OFFICE_SUPPLIES: "Office Supplies",
  PETROL: "Petrol Charges",
  PRODUCTS: "Products",
  OTHER: "Other",
} as const;
 

 export interface Expense {
  id: string;
  profile_id: string;

  expense_code: string;

  expense_type: ExpenseCategory;

  amount: number;
  approved_amount: number | null;

  currency: string;

  description: string;

  receipt_url: string | null;

  expense_date: string;

  status: ExpenseStatus;
  payment_status: PaymentStatus;

  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;

  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  expense_type: ExpenseCategory;

  amount: number;

  description: string;

  expense_date: string;

  receipt_url?: string;
}
export const EXPENSE_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
} as const;

export interface ExpenseFilters {
  profileId?: string;
  status?: ExpenseStatus;
  paymentStatus?: PaymentStatus;
}

export interface ExpenseWithEmployee extends Expense {
  employee: {
    employee_id: string;
    full_name: string;
    email: string;
    department: string | null;
    designation: string | null;
  } | null;
}

export const reviewExpenseSchema = z.object({
  expenseId: z.string().uuid(),

  status: z.enum([
    EXPENSE_STATUS.APPROVED,
    EXPENSE_STATUS.REJECTED,
  ]),

  approved_amount: z
    .number()
    .min(0, "Approved amount cannot be negative."),

  review_comment: z.string()
    .trim()
    .max(500)
    .optional(),
});

export type ReviewExpenseInput =
  z.infer<typeof reviewExpenseSchema>;

export interface TopEmployeeSummary {
  profileId: string;
  name: string;
  email: string;
  totalAmount: number;
  count: number;
}

export interface DepartmentSummary {
  department: string;
  totalAmount: number;
  count: number;
}

export interface MonthlySummary {
  month: string;
  amount: number;
  count: number;
}

export interface AdminExpenseSummary {
  totalCompanyExpense: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  totalExpenseCount: number;
  employeeCount: number;
  averageExpense: number;
  topEmployees: TopEmployeeSummary[];
  departmentSummary: DepartmentSummary[];
  monthlySummary: MonthlySummary[];
  recentExpenses: ExpenseWithEmployee[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
}

export interface EmployeeExpenseSummary {
  totalExpenses: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  totalExpenseCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  monthlyTotal: number;
  averageExpense: number;
  categorySummary: CategorySummary[];
  monthlySummary: MonthlySummary[];
  recentExpenses: Expense[];
}