export const ANNOUNCEMENT_TYPE = {
  GENERAL: "General",
  HOLIDAY: "Holiday",
  EVENT: "Event",
  MEETING: "Meeting",
  POLICY: "Policy",
  EMERGENCY: "Emergency",
} as const;

export const TARGET_AUDIENCE = {
  EVERYONE: "Everyone",
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  DEPARTMENT: "Department",
} as const;

export const ANNOUNCEMENT_STATUS = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
} as const;

export interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  target_audience: string;
  department: string | null;
  attachment_url: string | null;
  status: string;
  is_pinned: boolean;
  publish_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithCreator extends Announcement {
  creator?: {
    employee_id: string;
    full_name: string;
    email: string;
    department: string | null;
  }[];
}