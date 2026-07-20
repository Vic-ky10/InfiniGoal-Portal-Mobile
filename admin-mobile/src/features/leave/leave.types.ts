import { Employee } from "@/features/employee/employee.types";

export const LEAVE_TYPE = {
  CASUAL: "Casual Leave",
  SICK: "Sick Leave",
  WORK_FROM_HOME: "Work From Home",
  OTHER: "Other",
} as const;

export const LEAVE_DURATION = {
  FULL_DAY: "Full Day",
  HALF_DAY: "Half Day",
} as const;

export const HALF_DAY_SESSION = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
} as const;

export const LEAVE_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
} as const;

export type LeaveType = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE];
export type LeaveDuration =
  (typeof LEAVE_DURATION)[keyof typeof LEAVE_DURATION];
export type HalfDaySession =
  (typeof HALF_DAY_SESSION)[keyof typeof HALF_DAY_SESSION];
export type LeaveStatus =
  (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export interface LeaveRequest {
  id: string;
  profile_id: string;
  leave_type: LeaveType;
  leave_duration: LeaveDuration;
  half_day_session: HalfDaySession | null;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee?: Pick<
    Employee,
    "employee_id" | "full_name" | "email" | "department" | "designation"
  > | null;
}

export interface LeaveFilters {
  profileId?: string;
  status?: LeaveStatus | "";
}

/**
 * Temporary business configuration for yearly leave allowances.
 * TODO: Replace with a database-driven HR leave policy module when implemented.
 */
export const DEFAULT_LEAVE_ALLOWANCE = {
  [LEAVE_TYPE.CASUAL]: 12,
  [LEAVE_TYPE.SICK]: 10,
} as const;

export const TOTAL_DEFAULT_LEAVE_ALLOWANCE = 22;
