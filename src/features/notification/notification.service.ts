import { supabase } from "@/lib/supabase/client";
import { Notification } from "./notification.types";

const NOTIFICATION_SELECT = `
id,
profile_id,
title,
message,
notification_type,
reference_id,
action_url,
is_read,
created_by,
created_at,
updated_at
`;

export async function getNotifications(
  profileId: string
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("profile_id", profileId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as Notification[];
}

export async function markNotificationRead(
  notificationId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Notification marked as read.",
  };
}

export async function markAllNotificationsRead(
  profileId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profileId)
    .eq("is_read", false);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "All notifications marked as read.",
  };
}