import { getTodayAttendance } from "@/features/attendance/attendance.service";
import { getEmployeeLeaveRequests } from "@/features/leave/leave.service";
import { getEmployeeExpenses } from "@/features/expense/expense.service";
import { getEmployeeProjects } from "@/features/project/project.service";
import { getEmployeeTasks } from "@/features/task/task.service";
import { getEmployeeIncentives } from "@/features/incentive/incentive.service";
import { getAnnouncements } from "@/features/announcement/announcement.service";
import { getNotifications } from "@/features/notification/notification.service";

export interface EmployeeDashboardStats {
  todayStatus: string;
  pendingLeaves: number;
  pendingExpenses: number;
  activeTasks: number;
  myProjects: number;
  incentivesCount: number;
  announcementsCount: number;
  unreadNotifications: number;
}

export async function getEmployeeDashboardStats(profileId: string): Promise<EmployeeDashboardStats> {
  const [
    attendance,
    leaves,
    expenses,
    projects,
    tasks,
    incentives,
    announcements,
    notifications,
  ] = await Promise.all([
    getTodayAttendance(profileId),
    getEmployeeLeaveRequests(profileId),
    getEmployeeExpenses(profileId),
    getEmployeeProjects(profileId),
    getEmployeeTasks(profileId),
    getEmployeeIncentives(profileId),
    getAnnouncements(),
    getNotifications(profileId),
  ]);

  let todayStatus = "Not Logged In";
  if (attendance) {
    todayStatus = attendance.logout_time ? "Completed" : "Logged In";
  }

  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const pendingExpenses = expenses.filter((e) => e.status === "Pending").length;
  const activeTasks = tasks.filter((t) => t.status !== "Completed").length;
  const myProjects = projects.length;
  const incentivesCount = incentives.length;
  const announcementsCount = announcements.length;
  const unreadNotifications = notifications.filter((n) => !n.is_read).length;

  return {
    todayStatus,
    pendingLeaves,
    pendingExpenses,
    activeTasks,
    myProjects,
    incentivesCount,
    announcementsCount,
    unreadNotifications,
  };
}
