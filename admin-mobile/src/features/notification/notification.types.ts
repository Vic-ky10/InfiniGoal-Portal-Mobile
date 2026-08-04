export type NotificationType =
  | "Leave"
  | "Expense"
  | "Project"
  | "Task"
  | "Attendance"
  | "Announcement"
  | "Incentive"
  | "General";

export interface Notification {
  id: string;
  profile_id: string;

  title: string;
  message: string;

  notification_type: NotificationType;

  reference_id: string | null;
  action_url: string | null;

  is_read: boolean;

  created_by: string | null;

  created_at: string;
  updated_at: string;
}