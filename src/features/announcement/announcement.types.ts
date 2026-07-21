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
  announcement_type:
  (typeof ANNOUNCEMENT_TYPE)[keyof typeof ANNOUNCEMENT_TYPE];
  target_audience:
  (typeof TARGET_AUDIENCE)[keyof typeof TARGET_AUDIENCE];
  department: string | null;
  attachment_url: string | null;
  status:
  (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];
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