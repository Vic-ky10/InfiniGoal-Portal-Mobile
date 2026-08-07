import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  AttendanceFilters,
  AttendanceSummary,
  AttendanceWithEmployee,
} from "../attendance.types";
import { getTodayAttendanceDashboard } from "../attendance.service";

export function useAttendance(initialFilters: AttendanceFilters = {}) {
  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [presentRecords, setPresentRecords] = useState<
    AttendanceWithEmployee[]
  >([]);
  const [shortHoursRecords, setShortHoursRecords] = useState<
    AttendanceWithEmployee[]
  >([]);

  const [halfDayRecords, setHalfDayRecords] = useState<
    AttendanceWithEmployee[]
  >([]);
  const [incompleteRecords, setIncompleteRecords] = useState<
    AttendanceWithEmployee[]
  >([]);
  const [absentRecords, setAbsentRecords] = useState<AttendanceWithEmployee[]>(
    [],
  );

  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    shortHours: 0,
    halfDay: 0,
    incomplete: 0,
    absent: 0,
    totalWorkingHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AttendanceFilters>(initialFilters);
  const [refreshing, setRefreshing] = useState(false);

  const initialFiltersStr = JSON.stringify(initialFilters);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(JSON.parse(initialFiltersStr));
  }, [initialFiltersStr]);

  const fetchAttendance = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const dashboard = await getTodayAttendanceDashboard(filters);

      setSummary(dashboard.summary);
      setPresentRecords(dashboard.present);
      setShortHoursRecords(dashboard.shortHours);
      setHalfDayRecords(dashboard.halfDay);
      setIncompleteRecords(dashboard.incomplete);
      setAbsentRecords(dashboard.absent);

      // default list = Present employees
      setRecords(dashboard.present);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAttendance();

    const channel = supabase
      .channel("realtime-attendance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => {
          fetchAttendance(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAttendance]);

  return {
    records,
    setRecords,

    presentRecords,
    shortHoursRecords,
    halfDayRecords,
    incompleteRecords,
    absentRecords,

    summary,
    loading,
    refreshing,
    filters,
    setFilters,
    refresh: () => fetchAttendance(true),
  };
}
