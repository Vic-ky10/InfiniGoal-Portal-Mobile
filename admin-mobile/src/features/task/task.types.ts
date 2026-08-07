export const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;

export const TASK_STATUS = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
} as const;

export interface Task {
  id: string;
  project_id: string;
  project_member_id: string;

  task_code: string;

  title: string;
  description: string | null;

  priority: string;
  status: string;

  estimated_hours: number | null;
  actual_hours: number | null;

  due_date: string | null;
  completed_at: string | null;

  created_by: string;

  created_at: string;
  updated_at: string;
}

export interface TaskWithProject extends Task {
  project: {
    project_code: string;
    project_name: string;
    status: string;
  } | null;

  member: {
    id: string;
    profile_id: string;

    profile: {
      employee_id: string;
      full_name: string;
      email: string;
      department: string | null;
    } | null;
  } | null;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  date?: string;
  month?: string;
  year?: string;
  projectId?: string;
  profileId?: string;
}