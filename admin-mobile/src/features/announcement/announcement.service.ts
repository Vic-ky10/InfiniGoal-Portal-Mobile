import { supabase } from "@/lib/supabase/client";

import {
  Announcement,
  AnnouncementWithCreator,
  ANNOUNCEMENT_STATUS,
} from "./announcement.types";

import {
  AnnouncementInput,
  UpdateAnnouncementInput,
} from "./announcement.validation";

import { createNotification } from "@/features/notification";

const ANNOUNCEMENT_SELECT = `
id,
title,
message,
announcement_type,
target_audience,
department,
attachment_url,
status,
is_pinned,
publish_at,
expires_at,
created_by,
created_at,
updated_at,
creator:profiles!announcements_created_by_fkey(
employee_id,
full_name,
email,
department
)
`;

export async function getAuthenticatedProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getAnnouncements(): Promise<
  AnnouncementWithCreator[]
> {
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as AnnouncementWithCreator[];
}

export async function getAnnouncementById(
  id: string
): Promise<AnnouncementWithCreator | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data as AnnouncementWithCreator | null;
}

export async function createAnnouncement(
  createdBy: string,
  values: AnnouncementInput
) {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: values.title,
      message: values.message,
      announcement_type: values.announcement_type,
      target_audience: values.target_audience,
      department:
        values.target_audience === "Department"
          ? values.department
          : null,
      attachment_url: values.attachment_url || null,
      status: ANNOUNCEMENT_STATUS.DRAFT,
      is_pinned: values.is_pinned,
      publish_at: values.publish_at || null,
      expires_at: values.expires_at || null,
      created_by: createdBy,
    })
    .select(ANNOUNCEMENT_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Announcement created as draft.",
    data: data as Announcement,
  };
}


export async function updateAnnouncement(
  id: string,
  values: UpdateAnnouncementInput
) {
  const { data, error } = await supabase
    .from("announcements")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ANNOUNCEMENT_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Announcement updated successfully.",
    data: data as Announcement,
  };
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Announcement deleted successfully.",
  };
}

export async function publishAnnouncement(id: string) {
  const announcement = await getAnnouncementById(id);

  if (!announcement) {
    return {
      success: false,
      error: "Announcement not found.",
    };
  }

  if (announcement.status === ANNOUNCEMENT_STATUS.PUBLISHED) {
    return {
      success: false,
      error: "Announcement is already published.",
    };
  }

  const { error } = await supabase
    .from("announcements")
    .update({
      status: ANNOUNCEMENT_STATUS.PUBLISHED,
      publish_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  let query = supabase
    .from("profiles")
    .select("id");

  switch (announcement.target_audience) {
    case "Admin":
      query = query.eq("role", "Admin");
      break;

    case "Employee":
      query = query.eq("role", "Employee");
      break;

    case "Department":
      query = query.eq(
        "department",
        announcement.department
      );
      break;

    default:
      break;
  }

  const {
    data: recipients,
    error: recipientError,
  } = await query;

  if (recipientError) {
    return {
      success: false,
      error: recipientError.message,
    };
  }

  await Promise.all(
    (recipients ?? []).map((user) =>
      createNotification({
        profileId: user.id,
        title: announcement.title,
        message: announcement.message,
        notificationType: "Announcement",
        referenceId: announcement.id,
        actionUrl: "/employee/announcements",
        createdBy: announcement.created_by,
      })
    )
  );

  return {
    success: true,
    message: "Announcement published successfully.",
  };
}