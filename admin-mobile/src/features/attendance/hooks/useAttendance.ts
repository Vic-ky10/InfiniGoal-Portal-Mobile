import { useCallback, useEffect, useState } from "react";
import {
  AttendanceFilters,
  AttendanceSummary,
  AttendanceWithEmployee,
} from "../attendance.types";
import {
  getAttendanceRecords,
  getAttendanceSummary,
} from "../attendance.service";

export function useAttendance(initialFilters: AttendanceFilters = {}) {
  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    incomplete: 0,
    absent: 0,
    totalWorkingHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilters>(initialFilters);

  const fetchAttendance = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [data, summaryData] = await Promise.all([
        getAttendanceRecords(filters),
        getAttendanceSummary(filters),
      ]);

      setRecords(data);
      setSummary(summaryData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    records,
    summary,
    loading,
    refreshing,
    filters,
    setFilters,
    refresh: () => fetchAttendance(true),
  };
}
