import { useCallback, useEffect, useState } from "react";
import {
  IncentiveFilters,
  IncentiveWithEmployee,
  IncentiveStatus,
} from "../incentive.types";
import {
  getAuthenticatedProfileId,
  getIncentives,
  markIncentivePaid,
  reviewIncentive,
} from "../incentive.service";

export function useIncentives(initialFilters: IncentiveFilters = {}) {
  const [incentives, setIncentives] = useState<IncentiveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<IncentiveFilters>(initialFilters);

  const fetchIncentives = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getIncentives(filters);
      setIncentives(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchIncentives();
  }, [fetchIncentives]);

  const handleReview = async (incentiveId: string, status: IncentiveStatus) => {
    const profileId = await getAuthenticatedProfileId();
    if (!profileId) {
      return { success: false, error: "Authenticated profile not found." };
    }

    const result = await reviewIncentive(profileId, {
      incentiveId,
      status: status as "Approved" | "Rejected",
    });

    if (result.success) {
      fetchIncentives(true);
    }

    return result;
  };

  const handleMarkPaid = async (incentiveId: string) => {
    const profileId = await getAuthenticatedProfileId();
    if (!profileId) {
      return { success: false, error: "Authenticated profile not found." };
    }

    const result = await markIncentivePaid(incentiveId, profileId);
    if (result.success) {
      fetchIncentives(true);
    }
    return result;
  };

  return {
    incentives,
    loading,
    refreshing,
    filters,
    setFilters,
    refresh: () => fetchIncentives(true),
    handleReview,
    handleMarkPaid,
  };
}
