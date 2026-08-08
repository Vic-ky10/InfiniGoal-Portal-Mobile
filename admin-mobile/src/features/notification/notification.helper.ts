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

export function getNotificationRoute(notification: any, isAdmin: boolean): string | null {
  const type = (notification.notification_type || "").toLowerCase();
  const actionUrl = (notification.action_url || "").toLowerCase();
  const title = (notification.title || "").toLowerCase();
  const message = (notification.message || "").toLowerCase();
  const refId = notification.reference_id;

  const prefix = isAdmin ? "/(admin)" : "/(employee)";

  // 1. Leave
  if (type === "leave" || title.includes("leave") || message.includes("leave")) {
    return `${prefix}/leave`;
  }

  // 2. Attendance
  if (
    type === "attendance" ||
    title.includes("attendance") ||
    message.includes("attendance") ||
    title.includes("check-in") ||
    title.includes("check-out")
  ) {
    return `${prefix}/attendance`;
  }

  // 3. Customer Purchase (Incentive reviews / Sales)
  if (
    type.includes("purchase") ||
    title.includes("purchase") ||
    message.includes("purchase") ||
    (actionUrl.includes("sales") && !actionUrl.includes("customerid")) ||
    title.includes("incentive eligibility")
  ) {
    if (refId) {
      return `${prefix}/sales/purchases?purchaseId=${refId}`;
    }
    return `${prefix}/sales/purchases`;
  }

  // 3b. Customer Followups
  if (
    type.includes("followup") ||
    type.includes("follow-up") ||
    title.includes("follow-up") ||
    title.includes("followup") ||
    message.includes("follow-up") ||
    message.includes("followup") ||
    actionUrl.includes("customerid=")
  ) {
    let customerId = "";
    let followupId = "";
    if (notification.action_url) {
      const matchCust = notification.action_url.match(/customerId=([^&]+)/i);
      const matchFollow = notification.action_url.match(/followupId=([^&]+)/i);
      if (matchCust) customerId = matchCust[1];
      if (matchFollow) followupId = matchFollow[1];
    }
    if (!customerId && refId) {
      customerId = refId;
    }
    const queryParams = [];
    if (customerId) queryParams.push(`customerId=${customerId}`);
    if (followupId) queryParams.push(`followupId=${followupId}`);
    const queryStr = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    return `${prefix}/sales/customers${queryStr}`;
  }

  // 4. Expense
  if (
    type === "expense" ||
    title.includes("expense") ||
    message.includes("expense")
  ) {
    if (refId) {
      return `${prefix}/expenses?expenseId=${refId}`;
    }
    return `${prefix}/expenses`;
  }

  // 5. Incentives
  if (
    type === "incentive" ||
    title.includes("incentive") ||
    message.includes("incentive")
  ) {
    if (refId && isAdmin) {
      return `${prefix}/incentives?incentiveId=${refId}`;
    }
    return `${prefix}/incentives`;
  }

  // 6. Projects
  if (type === "project" || title.includes("project") || message.includes("project")) {
    if (refId && isAdmin) {
      return `${prefix}/projects?projectId=${refId}`;
    }
    return `${prefix}/projects`;
  }

  // 7. Tasks
  if (type === "task" || title.includes("task") || message.includes("task")) {
    if (refId) {
      return `${prefix}/tasks?taskId=${refId}`;
    }
    return `${prefix}/tasks`;
  }

  // 8. Announcements
  if (type === "announcement" || title.includes("announcement") || message.includes("announcement")) {
    return `${prefix}/announcements`;
  }

  // Fallback to actionUrl parsing
  if (notification.action_url) {
    const url = notification.action_url;
    if (url.startsWith("/employee/")) {
      const rest = url.replace("/employee/", "");
      if (rest === "tasks") return `/(employee)/tasks`;
      if (rest === "leave") return `/(employee)/leave`;
      if (rest === "expenses") return `/(employee)/expenses`;
      if (rest === "projects") return `/(employee)/projects`;
      if (rest === "announcements") return `/(employee)/announcements`;
      if (rest === "incentives") return `/(employee)/incentives`;
      if (rest.startsWith("sales")) return `/(employee)/sales/purchases`;
    } else {
      const rest = url.replace("/", "");
      if (rest === "tasks") return `/(admin)/tasks`;
      if (rest === "leave") return `/(admin)/leave`;
      if (rest === "expenses") return `/(admin)/expenses`;
      if (rest === "projects") return `/(admin)/projects`;
      if (rest === "announcements") return `/(admin)/announcements`;
      if (rest === "incentives") return `/(admin)/incentives`;
      if (rest.startsWith("sales")) return `/(admin)/sales/purchases`;
    }
  }

  return null;
}