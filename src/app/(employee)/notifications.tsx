import { useState, useEffect, useCallback } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { Notification } from "@/features/notification/notification.types";
import { getNotifications, markNotificationRead } from "@/features/notification/notification.service";

export default function EmployeeNotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
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
    loadData();
  }, [loadData]);

  const handleMarkRead = async (id: string) => {
    const res = await markNotificationRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Card
      style={{
        marginBottom: spacing.md,
        backgroundColor: item.is_read ? "#FFFFFF" : `${employeeColors.primary}08`,
        borderColor: item.is_read ? employeeColors.border : employeeColors.primary,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Badge label={item.notification_type} color={employeeColors.primary} variant="subtle" />
            {!item.is_read && <Badge label="New" color={employeeColors.warning} />}
          </View>

          <AppText weight="700" variant="h3" style={{ marginTop: spacing.xs }}>
            {item.title}
          </AppText>

          <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.xs }}>
            {item.message}
          </AppText>

          <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: spacing.sm }}>
            {new Date(item.created_at).toLocaleString()}
          </AppText>
        </View>

        {!item.is_read && (
          <TouchableOpacity onPress={() => handleMarkRead(item.id)} style={{ padding: spacing.xs }}>
            <Feather name="check-circle" size={20} color={employeeColors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Notifications" subtitle="Alerts and system notifications" />

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Notifications Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
