import { useCallback, useEffect, useState } from "react";
import {
  LeaveRequestWithEmployee,
  LeaveStatus,
} from "../leave.types";
import {
  getAuthenticatedProfileId,
  getLeaveRequests,
  reviewLeaveRequest,
} from "../leave.service";

export function useLeave() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaveRequests = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getLeaveRequests();
      setLeaveRequests(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleReview = async (
    leaveRequestId: string,
    status: LeaveStatus,
    comment?: string
  ) => {
    const profileId = await getAuthenticatedProfileId();

    if (!profileId) {
      return {
        success: false,
        error: "Authenticated profile not found.",
      };
    }

    const result = await reviewLeaveRequest(profileId, {
      leaveRequestId,
      status: status as "Approved" | "Rejected",
      review_comment: comment,
    });

    if (result.success) {
      fetchLeaveRequests(true);
    }

    return result;
  };

  return {
    leaveRequests,
    loading,
    refreshing,
    refresh: () => fetchLeaveRequests(true),
    handleReview,
  };
}