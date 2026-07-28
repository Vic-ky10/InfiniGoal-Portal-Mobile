// import { View, FlatList, TouchableOpacity } from "react-native";

// import { AppText, Screen } from "@/components/ui";
// import { AppHeader, EmptyState } from "@/components/common";
// import { adminColors, spacing } from "@/theme";

// import { useNotifications } from "@/features/notification/hooks/useNotifications";
// import NotificationItem from "@/features/notification/components/NotificationItem";

// export default function NotificationsScreen() {
//   const { notifications, unreadCount, loading, refreshing, refresh, handleMarkRead, handleMarkAllRead } =
//     useNotifications();

//   return (
//     <Screen
//       scroll={false}
//       isLoading={loading}
//       refreshing={refreshing}
//       onRefresh={refresh}
//     >
//       <View style={{ flex: 1, gap: spacing.md }}>
//         <AppHeader
//           title="Notifications"
//           subtitle={unreadCount > 0 ? `${unreadCount} unread message(s)` : "All caught up"}
//           rightComponent={
//             unreadCount > 0 ? (
//               <TouchableOpacity onPress={handleMarkAllRead} style={{ padding: spacing.xs }}>
//                 <AppText variant="caption" weight="700" color={adminColors.primary}>
//                   Mark all read
//                 </AppText>
//               </TouchableOpacity>
//             ) : undefined
//           }
//         />

//         {/* Notifications List */}
//         <FlatList
//           data={notifications}
//           keyExtractor={(item) => item.id}
//           refreshing={refreshing}
//           onRefresh={refresh}
//           contentContainerStyle={{
//             gap: spacing.md,
//             paddingBottom: spacing.xl,
//             flexGrow: notifications.length === 0 ? 1 : undefined,
//           }}
//           ListEmptyComponent={<EmptyState title="No notifications available." />}
//           renderItem={({ item }) => (
//             <NotificationItem notification={item} onPress={handleMarkRead} />
//           )}
//         />
//       </View>
//     </Screen>
//   );
// }

import NotificationDetailModal from "@/features/notification/components/NotificationDetailModal";
import { Notification } from "@/features/notification/notification.types";
import { useMemo, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";

import { AppText, Card, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useNotifications } from "@/features/notification/hooks/useNotifications";
import NotificationItem from "@/features/notification/components/NotificationItem";
import { Feather } from "@expo/vector-icons";

const FILTERS = ["All", "Unread", "Read"] as const;

export default function NotificationsScreen() {
  const colors = adminColors;

  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTERS)[number]>("All");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    handleMarkRead,
    handleMarkAllRead,
  } = useNotifications();

  const handleOpenNotification = (notification: Notification) => {
    handleMarkRead(notification.id);

    setSelectedNotification(notification);

    setModalVisible(true);
  };

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

  const todayCount = notifications.filter((n) => {
    const today = new Date().toDateString();
    return new Date(n.created_at).toDateString() === today;
  }).length;

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
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
        

        {/* notifiation */}

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
            <AppText color="#fff" weight="700" variant="caption">
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
                  weight="700"
                  variant="caption"
                  color={active ? "#fff" : colors.textSecondary}
                >
                  {filter}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Notification List */}

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredNotifications.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="You're all caught up!" />}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleOpenNotification}
              colors={adminColors}
            />
          )}
        />

        <NotificationDetailModal
          visible={modalVisible}
          notification={selectedNotification}
          onClose={() => {
            setModalVisible(false);
            setSelectedNotification(null);
          }}
          colors={adminColors}
        />
      </View>
    </Screen>
  );
}
