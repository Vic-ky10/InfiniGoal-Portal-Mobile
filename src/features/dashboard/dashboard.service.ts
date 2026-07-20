import { supabase } from "@/lib/supabase/client";


export async function getDashboardStats() {
  const [
    employees,
    attendance,
    leaves,
    expenses,
    projects,
    tasks,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
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
  ]);

  return {
    totalEmployees: employees.count ?? 0,
    presentToday: attendance.count ?? 0,
    pendingLeaves: leaves.count ?? 0,
    pendingExpenses: expenses.count ?? 0,
    activeProjects: projects.count ?? 0,
    totalTasks: tasks.count ?? 0,
  };
}