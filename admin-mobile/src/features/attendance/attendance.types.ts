import { Employee } from "@/features/employee/employee.types";

export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  SHORT_HOURS: "Short Hours",
  HALF_DAY: "Half Day",
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
  month?: string; // e.g., "0" to "11" or "2023-01"
  year?: string;
  status?: AttendanceStatus | "";
  search?: string;
  department?: string;
}
export interface AttendanceSummary {
  total: number;
  present: number;
  shortHours: number;
  halfDay: number;
  incomplete: number;
  absent: number;
  totalWorkingHours: number;
}

export interface AttendanceDashboard {
  summary: AttendanceSummary;
  present: AttendanceWithEmployee[];
  shortHours: AttendanceWithEmployee[];
  halfDay: AttendanceWithEmployee[];
  incomplete: AttendanceWithEmployee[];
  absent: AttendanceWithEmployee[];
}