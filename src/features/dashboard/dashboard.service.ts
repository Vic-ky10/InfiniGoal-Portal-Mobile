import { supabase } from "@/lib/supabase/client";
import { getTodayDate } from "@/features/attendance/attendance.utils";

export async function getDashboardStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    employees,
    attendance,
    leaves,
    expenses,
    projects,
    tasks,
    announcements,
    notifications,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
   supabase
  .from("attendance")
  .select("*", { count: "exact", head: true })
  .eq("attendance_date", getTodayDate())
  .eq("status", "Present"),
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "Pending"),
    supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("status", "Pending"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("announcements")
      .select("*", { count: "exact", head: true }),
    user
      ? supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id)
          .eq("is_read", false)
      : Promise.resolve({ count: 0, error: null }),
  ]);
const totalEmployees = employees.count ?? 0;
const presentToday = attendance.count ?? 0;

return {
  totalEmployees,
  presentToday,
  attendanceToday: `${presentToday} / ${totalEmployees}`,

  pendingLeaves: leaves.count ?? 0,
  pendingExpenses: expenses.count ?? 0,
  activeProjects: projects.count ?? 0,
  totalTasks: tasks.count ?? 0,
  totalAnnouncements: announcements.count ?? 0,
  unreadNotifications: notifications.count ?? 0,
};
}