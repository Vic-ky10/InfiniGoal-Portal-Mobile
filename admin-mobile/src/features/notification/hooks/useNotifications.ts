import { useCallback, useEffect, useState } from "react";
import { Notification } from "../notification.types";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notification.service";
import { supabase } from "@/lib/supabase/client";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        return;
      }

      const data = await getNotifications(user.id);
      setNotifications(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          // Silently fetch latest notifications on any change
          fetchNotifications(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
    return result;
  };

  const handleMarkAllRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const result = await markAllNotificationsRead(user.id);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    return result;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh: () => fetchNotifications(true),
    handleMarkRead,
    handleMarkAllRead,
  };
}
