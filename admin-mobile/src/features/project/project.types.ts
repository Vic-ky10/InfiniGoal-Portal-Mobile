import { Employee } from "@/features/employee/employee.types";

export const PROJECT_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export const PROJECT_STATUS = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  CANCELLED: "Cancelled",
} as const;

export const PROJECT_MEMBER_ROLE = {
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer",
  SALES: "Sales",
  MARKETING: "Marketing",
  ANALYTICS: "Analytics",
  OTHER: "Other",
} as const;

export const PROJECT_MEMBER_STATUS = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  REMOVED: "Removed",
} as const;

export type ProjectPriority =
  (typeof PROJECT_PRIORITY)[keyof typeof PROJECT_PRIORITY];
export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
export type ProjectMemberRole =
  (typeof PROJECT_MEMBER_ROLE)[keyof typeof PROJECT_MEMBER_ROLE];
export type ProjectMemberStatus =
  (typeof PROJECT_MEMBER_STATUS)[keyof typeof PROJECT_MEMBER_STATUS];

export interface Project {
  id: string;
  project_name: string;
  project_code: string;
  description: string | null;
  priority: ProjectPriority;
  progress: number;
  start_date: string;
  end_date: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  profile_id: string;
  assigned_by: string;
  member_role: ProjectMemberRole;
  status: ProjectMemberStatus;
  assigned_at: string;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberWithEmployee extends ProjectMember {
  employee?: Pick<
    Employee,
    "employee_id" | "full_name" | "email" | "department" | "designation"
  > | null;
}

export interface ProjectWithMembers extends Project {
  members: ProjectMemberWithEmployee[];
}

export interface EmployeeProject extends ProjectMember {
  project?: Project | null;
  team: ProjectMemberWithEmployee[];
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | "";
  priority?: ProjectPriority | "";
  date?: string;
  month?: string;
  year?: string;
}

export interface ProjectDashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  archivedProjects: number;
}
