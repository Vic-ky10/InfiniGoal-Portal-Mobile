import { useState, useEffect, useCallback } from "react";
import { View, FlatList } from "react-native";

import NotificationItem from "@/features/notification/components/NotificationItem";
import NotificationDetailModal from "@/features/notification/components/NotificationDetailModal";
import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { supabase } from "@/lib/supabase/client";
import { employeeColors, spacing } from "@/theme";
import { Notification } from "@/features/notification/notification.types";
import {
  getNotifications,
  markNotificationRead,
} from "@/features/notification/notification.service";

export default function EmployeeNotificationsScreen() {
  const [loading, setLoading] = useState(true);

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  const handleOpenNotification = async (notification: Notification) => {
    if (!notification.is_read) {
      const res = await markNotificationRead(notification.id);

      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n,
          ),
        );
      }
    }

    setSelectedNotification(notification);

    setModalVisible(true);
  };

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Notifications"
          subtitle="Alerts and system notifications"
        />


        

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={(notification) => handleOpenNotification(notification)}
              colors={employeeColors}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: spacing.sm }} />
          )}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Notifications Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl, paddingHorizontal: spacing.xs }}
        />

        <NotificationDetailModal
          visible={modalVisible}
          notification={selectedNotification}
          onClose={() => {
            setModalVisible(false);
            setSelectedNotification(null);
          }}
          colors={employeeColors}
        />
      </View>
    </Screen>
  );
}
