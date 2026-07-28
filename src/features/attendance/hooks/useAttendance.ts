import { useCallback, useEffect, useState } from "react";
import {
  AttendanceFilters,
  AttendanceSummary,
  AttendanceWithEmployee,
} from "../attendance.types";
import {

  getTodayAttendanceDashboard,
} from "../attendance.service";

export function useAttendance(initialFilters: AttendanceFilters = {}) {
  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [presentRecords, setPresentRecords] = useState<
    AttendanceWithEmployee[]
  >([]);
  const [incompleteRecords, setIncompleteRecords] = useState<
    AttendanceWithEmployee[]
  >([]);
const [absentRecords, setAbsentRecords] =
  useState<AttendanceWithEmployee[]>([]);

  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    incomplete: 0,
    absent: 0,
    totalWorkingHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [filters, setFilters] = useState<AttendanceFilters>(initialFilters);

  // useEffect(() => {
  //   setFilters(initialFilters);
  // }, [initialFilters]);

  const fetchAttendance = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const dashboard = await getTodayAttendanceDashboard();

      setSummary(dashboard.summary);

      setPresentRecords(dashboard.present);
      setIncompleteRecords(dashboard.incomplete);
      setAbsentRecords(dashboard.absent);

      // default list = Present employees

      setRecords(dashboard.present);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
  records,
  setRecords,

  presentRecords,
  incompleteRecords,
  absentRecords,

  summary,
  loading,
  refreshing,
  refresh: () => fetchAttendance(true),
};
}
