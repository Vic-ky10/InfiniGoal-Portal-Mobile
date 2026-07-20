import { Employee } from "@/features/employee/employee.types";

export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  INCOMPLETE: "Incomplete",
  ABSENT: "Absent",
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export interface Attendance {
  id: string;
  profile_id: string;
  attendance_date: string;
  login_time: string | null;
  logout_time: string | null;
  working_hours: number | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithEmployee extends Attendance {
  employee?: Pick<
    Employee,
    "employee_id" | "full_name" | "email" | "department" | "designation"
  > | null;
}

export interface AttendanceFilters {
  profileId?: string;
  date?: string;
  status?: AttendanceStatus | "";
  search?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  incomplete: number;
  absent: number;
  totalWorkingHours: number;
}
