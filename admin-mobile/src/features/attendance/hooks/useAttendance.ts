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
      
      let dashboard;
      if (filters.month || filters.year) {
        // Fetch all employees/profiles
        const { data: employees } = await supabase.from("profiles").select("*");
        // Fetch all attendance records
        const { data: records } = await supabase
          .from("attendance")
          .select("id, profile_id, attendance_date, login_time, logout_time, working_hours, status, notes, created_at, updated_at, employee:profiles!attendance_profile_id_fkey(employee_id, full_name, email, department, designation)")
          .order("attendance_date", { ascending: false });

        const empList = (employees || []) as any[];
        const recList = (records || []).map((r: any) => ({
          ...r,
          employee: Array.isArray(r.employee) ? r.employee[0] : r.employee,
        }));

        // Filter records by month/year
        let filteredRecords = recList;
        if (filters.month) {
          filteredRecords = filteredRecords.filter(r => r.attendance_date.startsWith(filters.month!));
        }
        if (filters.year) {
          filteredRecords = filteredRecords.filter(r => r.attendance_date.startsWith(filters.year!));
        }

        // Apply search/department/status filters to employees
        let filteredEmployees = empList;
        if (filters.profileId) {
          filteredEmployees = filteredEmployees.filter(emp => emp.id === filters.profileId);
        }
        if (filters.department) {
          filteredEmployees = filteredEmployees.filter(emp => emp.department === filters.department);
        }
        if (filters.search) {
          const s = filters.search.toLowerCase();
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.full_name.toLowerCase().includes(s) ||
            emp.employee_id.toLowerCase().includes(s) ||
            emp.email.toLowerCase().includes(s)
          );
        }

        const present: any[] = [];
        const shortHours: any[] = [];
        const halfDay: any[] = [];
        const incomplete: any[] = [];
        const absent: any[] = [];

        for (const record of filteredRecords) {
          const emp = filteredEmployees.find(e => e.id === record.profile_id);
          if (!emp) continue;

          const recordWithEmp = {
            ...record,
            employee: emp,
          };

          if (filters.status && record.status !== filters.status) {
            continue;
          }

          if (record.login_time && !record.logout_time) {
            incomplete.push(recordWithEmp);
          } else if (record.status === "Half Day") {
            halfDay.push(recordWithEmp);
          } else if (record.status === "Short Hours") {
            shortHours.push(recordWithEmp);
          } else if (record.status === "Present") {
            present.push(recordWithEmp);
          }
        }

        let totalWorkingHours = 0;
        filteredRecords.forEach(r => {
          if (filteredEmployees.some(e => e.id === r.profile_id)) {
            totalWorkingHours += r.working_hours ?? 0;
          }
        });

        dashboard = {
          summary: {
            total: present.length + shortHours.length + halfDay.length + incomplete.length,
            present: present.length,
            shortHours: shortHours.length,
            halfDay: halfDay.length,
            incomplete: incomplete.length,
            absent: 0,
            totalWorkingHours,
          },
          present,
          shortHours,
          halfDay,
          incomplete,
          absent,
        };
      } else {
        dashboard = await getTodayAttendanceDashboard(filters);
      }

      setSummary(dashboard.summary);
      setPresentRecords(dashboard.present);
      setShortHoursRecords(dashboard.shortHours);
      setHalfDayRecords(dashboard.halfDay);
      setIncompleteRecords(dashboard.incomplete);
      setAbsentRecords(dashboard.absent);

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
