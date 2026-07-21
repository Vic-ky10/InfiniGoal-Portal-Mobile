import { View, FlatList, TouchableOpacity } from "react-native";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, spacing } from "@/theme";

import { useNotifications } from "@/features/notification/hooks/useNotifications";
import NotificationItem from "@/features/notification/components/NotificationItem";

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, refreshing, refresh, handleMarkRead, handleMarkAllRead } =
    useNotifications();

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread message(s)` : "All caught up"}
          rightComponent={
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllRead} style={{ padding: spacing.xs }}>
                <AppText variant="caption" weight="700" color={adminColors.primary}>
                  Mark all read
                </AppText>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: notifications.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No notifications available." />}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={handleMarkRead} />
          )}
        />
      </View>
    </Screen>
  );
}