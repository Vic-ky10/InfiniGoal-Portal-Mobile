import { supabase } from "@/lib/supabase/client";

import {
  LEAVE_DURATION,
  LEAVE_STATUS,
  LeaveFilters,
  LeaveRequest,
  LeaveRequestWithEmployee,
} from "./leave.types";

import {
  LeaveRequestInput,
  ReviewLeaveInput,
} from "./leave.validation";

import { calculateLeaveDays } from "./leave.utils";

const LEAVE_SELECT =
  "id, profile_id, leave_type, leave_duration, half_day_session, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at, review_comment, created_at, updated_at";

const LEAVE_WITH_EMPLOYEE_SELECT =
  "id, profile_id, leave_type, leave_duration, half_day_session, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at, review_comment, created_at, updated_at, employee:profiles!leave_requests_profile_id_fkey(employee_id, full_name, email, department, designation)";

export async function getAuthenticatedProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function createLeaveRequest(
  profileId: string,
  values: LeaveRequestInput
) {
  const totalDays = calculateLeaveDays(values);

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      profile_id: profileId,
      leave_type: values.leave_type,
      leave_duration: values.leave_duration,
      half_day_session:
        values.leave_duration === LEAVE_DURATION.HALF_DAY
          ? values.half_day_session
          : null,
      start_date: values.start_date,
      end_date: values.end_date,
      total_days: totalDays,
      reason: values.reason,
      status: LEAVE_STATUS.PENDING,
    })
    .select(LEAVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Leave request submitted successfully.",
    data: data as LeaveRequest,
  };
}

export async function getEmployeeLeaveRequests(
  profileId: string,
  filters: LeaveFilters = {}
): Promise<LeaveRequest[]> {
  let query = supabase
    .from("leave_requests")
    .select(LEAVE_SELECT)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data as LeaveRequest[];
}

export async function getLeaveRequests(
  filters: LeaveFilters = {}
): Promise<LeaveRequestWithEmployee[]> {
  let query = supabase
    .from("leave_requests")
    .select(LEAVE_WITH_EMPLOYEE_SELECT)
    .order("created_at", { ascending: false });

  if (filters.profileId) {
    query = query.eq("profile_id", filters.profileId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (data as SupabaseLeaveRecord[]).map((record) => ({
    ...record,
    employee: Array.isArray(record.employee)
      ? record.employee[0] ?? null
      : record.employee,
  }));
}

export async function cancelPendingLeaveRequest(
  profileId: string,
  leaveRequestId: string
) {
  const existing = await getLeaveRequestById(leaveRequestId);

  if (!existing || existing.profile_id !== profileId) {
    return {
      success: false,
      error: "Leave request was not found.",
    };
  }

  if (existing.status !== LEAVE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending leave requests can be cancelled.",
    };
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status: LEAVE_STATUS.CANCELLED,
    })
    .eq("id", leaveRequestId)
    .eq("profile_id", profileId)
    .eq("status", LEAVE_STATUS.PENDING)
    .select(LEAVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Leave request cancelled successfully.",
    data: data as LeaveRequest,
  };
}

export async function reviewLeaveRequest(
  reviewerId: string,
  values: ReviewLeaveInput
) {
  const existing = await getLeaveRequestById(values.leaveRequestId);

  if (!existing) {
    return {
      success: false,
      error: "Leave request was not found.",
    };
  }

  if (existing.status !== LEAVE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending leave requests can be reviewed.",
    };
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status: values.status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comment: values.review_comment ?? null,
    })
    .eq("id", values.leaveRequestId)
    .eq("status", LEAVE_STATUS.PENDING)
    .select(LEAVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Notification logic will be added after the Notification module is migrated.

  return {
    success: true,
    message: `Leave request ${values.status.toLowerCase()} successfully.`,
    data: data as LeaveRequest,
  };
}

async function getLeaveRequestById(id: string) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select(LEAVE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data as LeaveRequest | null;
}

type SupabaseLeaveRecord = LeaveRequestWithEmployee & {
  employee:
    | LeaveRequestWithEmployee["employee"]
    | NonNullable<LeaveRequestWithEmployee["employee"]>[];
};