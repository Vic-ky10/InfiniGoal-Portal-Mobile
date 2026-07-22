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
import { View, FlatList, TouchableOpacity } from "react-native";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useNotifications } from "@/features/notification/hooks/useNotifications";
import NotificationItem from "@/features/notification/components/NotificationItem";

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
              ? `${unreadCount} unread notifications`
              : "You're all caught up!"
          }
        />

       
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <View style={{ alignItems: "center" }}>
            <AppText variant="h2" weight="700">
              {unreadCount}
            </AppText>
            <AppText variant="caption">Unread</AppText>
          </View>

          <View style={{ alignItems: "center" }}>
            <AppText variant="h2" weight="700">
              {todayCount}
            </AppText>
            <AppText variant="caption">Today</AppText>
          </View>

          <View style={{ alignItems: "center" }}>
            <AppText variant="h2" weight="700">
              {notifications.length}
            </AppText>
            <AppText variant="caption">Total</AppText>
          </View>
        </View>

       {/* Notifiation */}
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={{
              alignSelf: "flex-end",
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
            }}
          >
            <AppText color="#fff" weight="700" variant="caption">
              Mark all as read
            </AppText>
          </TouchableOpacity>
        )}

        {/* Filters */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
          }}
        >
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <AppText
                  weight="700"
                  variant="caption"
                  color={active ? "#fff" : colors.textSecondary}
                >
                  {filter}
                </AppText>
              </TouchableOpacity>
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
