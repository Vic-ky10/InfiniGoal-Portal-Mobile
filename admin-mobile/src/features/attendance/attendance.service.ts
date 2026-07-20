import { supabase } from "@/lib/supabase/client";

import {
  ATTENDANCE_STATUS,
  Attendance,
  AttendanceFilters,
  AttendanceSummary,
  AttendanceWithEmployee,
} from "./attendance.types";

import {
  calculateWorkingHours,
  getTodayDate,
  isAlreadyLoggedIn,
  isAlreadyLoggedOut,
} from "./attendance.utils";

const ATTENDANCE_SELECT =
  "id, profile_id, attendance_date, login_time, logout_time, working_hours, status, notes, created_at, updated_at";

const ATTENDANCE_WITH_EMPLOYEE_SELECT =
  "id, profile_id, attendance_date, login_time, logout_time, working_hours, status, notes, created_at, updated_at, employee:profiles!attendance_profile_id_fkey(employee_id, full_name, email, department, designation)";

export async function getCurrentProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function loginAttendance(
  profileId: string,
  notes?: string
) {
  const todayAttendance = await getTodayAttendance(profileId);

  if (isAlreadyLoggedIn(todayAttendance)) {
    return {
      success: false,
      error: "Attendance login already exists for today.",
    };
  }

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      profile_id: profileId,
      attendance_date: getTodayDate(),
      login_time: new Date().toISOString(),
      status: ATTENDANCE_STATUS.PRESENT,
      notes: notes ?? null,
    })
    .select(ATTENDANCE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Attendance login marked successfully.",
    data: data as Attendance,
  };
}

export async function logoutAttendance(profileId: string) {
  const todayAttendance = await getTodayAttendance(profileId);

  if (!isAlreadyLoggedIn(todayAttendance)) {
    return {
      success: false,
      error: "Please login attendance before logout.",
    };
  }

  if (isAlreadyLoggedOut(todayAttendance)) {
    return {
      success: false,
      error: "Attendance logout already exists for today.",
    };
  }

  const logoutTime = new Date().toISOString();

  const workingHours = calculateWorkingHours(
    todayAttendance!.login_time!,
    logoutTime
  );

  const { data, error } = await supabase
    .from("attendance")
    .update({
      logout_time: logoutTime,
      working_hours: workingHours,
      status: ATTENDANCE_STATUS.PRESENT,
    })
    .eq("id", todayAttendance!.id)
    .select(ATTENDANCE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Attendance logout marked successfully.",
    data: data as Attendance,
  };
}


export async function getTodayAttendance(
  profileId: string
): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from("attendance")
    .select(ATTENDANCE_SELECT)
    .eq("profile_id", profileId)
    .eq("attendance_date", getTodayDate())
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Attendance | null;
}

export async function getAttendanceHistory(
  profileId: string,
  limit = 30
): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select(ATTENDANCE_SELECT)
    .eq("profile_id", profileId)
    .order("attendance_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return data as Attendance[];
}

export async function getAttendanceByEmployee(
  profileId: string
): Promise<Attendance[]> {
  return getAttendanceHistory(profileId, 100);
}

export async function getAttendanceRecords(
  filters: AttendanceFilters = {}
): Promise<AttendanceWithEmployee[]> {
  let query = supabase
    .from("attendance")
    .select(ATTENDANCE_WITH_EMPLOYEE_SELECT)
    .order("attendance_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.profileId) {
    query = query.eq("profile_id", filters.profileId);
  }

  if (filters.date) {
    query = query.eq("attendance_date", filters.date);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  const records = (data as SupabaseAttendanceRecord[]).map((record) => ({
    ...record,
    employee: Array.isArray(record.employee)
      ? record.employee[0] ?? null
      : record.employee,
  }));

  const search = filters.search?.toLowerCase();

  if (!search) {
    return records;
  }

  return records.filter((record) => {
    const employee = record.employee;

    return (
      record.profile_id.toLowerCase().includes(search) ||
      employee?.employee_id.toLowerCase().includes(search) ||
      employee?.full_name.toLowerCase().includes(search) ||
      employee?.email.toLowerCase().includes(search)
    );
  });
}

type SupabaseAttendanceRecord = AttendanceWithEmployee & {
  employee:
    | AttendanceWithEmployee["employee"]
    | NonNullable<AttendanceWithEmployee["employee"]>[];
};

export async function getAttendanceSummary(
  filters: AttendanceFilters = {}
): Promise<AttendanceSummary> {
  const records = await getAttendanceRecords(filters);

  return records.reduce<AttendanceSummary>(
    (summary, record) => {
      summary.total++;
      summary.totalWorkingHours += record.working_hours ?? 0;

      if (record.status === ATTENDANCE_STATUS.PRESENT) {
        summary.present++;
      } else if (record.status === ATTENDANCE_STATUS.INCOMPLETE) {
        summary.incomplete++;
      } else if (record.status === ATTENDANCE_STATUS.ABSENT) {
        summary.absent++;
      }

      return summary;
    },
    {
      total: 0,
      present: 0,
      incomplete: 0,
      absent: 0,
      totalWorkingHours: 0,
    }
  );
}