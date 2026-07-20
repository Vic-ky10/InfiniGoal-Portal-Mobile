export const INCENTIVE_TYPE = {
  CUSTOMER_CONVERSION: "Customer Conversion",
  PERFORMANCE: "Performance",
  SPECIAL_BONUS: "Special Bonus",
} as const;

export const INCENTIVE_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const INCENTIVE_PAYMENT_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
} as const;

export type IncentiveType =
  (typeof INCENTIVE_TYPE)[keyof typeof INCENTIVE_TYPE];

export type IncentiveStatus =
  (typeof INCENTIVE_STATUS)[keyof typeof INCENTIVE_STATUS];

export type IncentivePaymentStatus =
  (typeof INCENTIVE_PAYMENT_STATUS)[keyof typeof INCENTIVE_PAYMENT_STATUS];

export interface Incentive {
  id: string;
  profile_id: string;
  incentive_code: string;
  incentive_type: IncentiveType;
  title: string;
  description: string;
  amount: number;
  month: number;
  year: number;
  status: IncentiveStatus;
  payment_status: IncentivePaymentStatus;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncentiveFilters {
  profileId?: string;
  type?: IncentiveType;
  status?: IncentiveStatus;
  paymentStatus?: IncentivePaymentStatus;
  month?: number;
  year?: number;
}

export interface IncentiveWithEmployee extends Incentive {
  employee: {
    employee_id: string;
    full_name: string;
    email: string;
    department: string | null;
    designation: string | null;
  } | null;
  approver: {
    employee_id: string;
    full_name: string;
    email: string;
  } | null;
  creator: {
    employee_id: string;
    full_name: string;
    email: string;
  } | null;
}
