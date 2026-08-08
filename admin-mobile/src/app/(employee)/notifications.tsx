import { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import NotificationItem from "@/features/notification/components/NotificationItem";
import NotificationDetailModal from "@/features/notification/components/NotificationDetailModal";
import { Screen, Card, AppText } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { supabase } from "@/lib/supabase/client";
import { employeeColors, spacing, radius } from "@/theme";
import { Notification } from "@/features/notification/notification.types";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/notification/notification.service";
import { getNotificationRoute } from "@/features/notification/notification.helper";

const FILTERS = ["All", "Unread", "Read"] as const;

export default function EmployeeNotificationsScreen() {
  const colors = employeeColors;
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTERS)[number]>("All");
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

    const route = getNotificationRoute(notification, false);
    if (route) {
      router.push(route as any);
    } else {
      setSelectedNotification(notification);
      setModalVisible(true);
    }
  };

  const handleMarkAllRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const res = await markAllNotificationsRead(user.id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true })),
      );
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return notifications.filter((n) => {
      return new Date(n.created_at).toDateString() === today;
    }).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (selectedFilter) {
      case "Unread":
        return notifications.filter((n) => !n.is_read);

      case "Read":
        return notifications.filter((n) => n.is_read);

      default:
        return notifications;
    }
  }, [notifications, selectedFilter]);

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="🔔 Notifications"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} - unread notifications`
              : "You're all caught up!"
          }
        />

        <Card
          style={{
            paddingVertical: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.lg,
            }}
          >
            <AppText variant="body" weight="700">
              Notification Overview
            </AppText>

            <Feather
              name="bell"
              size={18}
              color={colors.primary}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <AppText
                variant="h1"
                weight="700"
                color={colors.text}
              >
                {unreadCount}
              </AppText>

              <AppText
                variant="caption"
                color={colors.textSecondary}
              >
                Unread
              </AppText>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: colors.border,
                marginVertical: 6,
              }}
            />

            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <AppText
                variant="h1"
                weight="700"
                color={colors.text}
              >
                {todayCount}
              </AppText>

              <AppText
                variant="caption"
                color={colors.textSecondary}
              >
                Today
              </AppText>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: colors.border,
                marginVertical: 6,
              }}
            />

            <View
              style={{
                flex: 1,
                alignItems: "center",
              }}
            >
              <AppText
                variant="h1"
                weight="700"
                color={colors.text}
              >
                {notifications.length}
              </AppText>

              <AppText
                variant="caption"
                color={colors.textSecondary}
              >
                Total
              </AppText>
            </View>
          </View>
        </Card>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            android_ripple={{ color: "transparent" }}
            style={({ pressed }) => ({
              alignSelf: "flex-end",
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
              opacity: pressed ? 0.9 : 1,
              ...Platform.select({
                web: {
                  cursor: "pointer",
                  outlineStyle: "none",
                } as any,
              }),
            })}
          >
            <AppText color="#168403ff" weight="900" variant="caption">
              Mark all as read
            </AppText>
          </Pressable>
        )}

        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
          }}
        >
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                android_ripple={{ color: "transparent" }}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.9 : 1,
                  ...Platform.select({
                    web: {
                      cursor: "pointer",
                      outlineStyle: "none",
                    } as any,
                  }),
                })}
              >
                <AppText
                  weight="900"
                  variant="caption"
                  color={active ? "#1eff0eff" : colors.textSecondary}
                >
                  {filter}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={(notification) => handleOpenNotification(notification)}
              colors={colors}
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
