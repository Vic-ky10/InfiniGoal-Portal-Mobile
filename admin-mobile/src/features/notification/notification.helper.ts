import { supabase } from "@/lib/supabase/client";
import { NotificationType } from "./notification.types";

interface CreateNotificationParams {
  profileId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  referenceId?: string;
  actionUrl?: string;
  createdBy?: string;
}

interface NotifyAdminsParams {
  title: string;
  message: string;
  notificationType: NotificationType;
  referenceId?: string;
  actionUrl?: string;
  createdBy?: string;
}

export async function createNotification({
  profileId,
  title,
  message,
  notificationType,
  referenceId,
  actionUrl,
  createdBy,
}: CreateNotificationParams) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      profile_id: profileId,
      title,
      message,
      notification_type: notificationType,
      reference_id: referenceId ?? null,
      action_url: actionUrl ?? null,
      is_read: false,
      created_by: createdBy ?? null,
    });

  if (error) {
    console.error(error);
  }
}

export async function notifyAdmins({
  title,
  message,
  notificationType,
  referenceId,
  actionUrl,
  createdBy,
}: NotifyAdminsParams) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "Admin");

  if (error) {
    console.error(error);
    return;
  }

  await Promise.all(
    (data ?? []).map((admin) =>
      createNotification({
        profileId: admin.id,
        title,
        message,
        notificationType,
        referenceId,
        actionUrl,
        createdBy,
      })
    )
  );
}