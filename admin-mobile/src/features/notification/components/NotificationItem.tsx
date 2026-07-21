import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { Notification } from "../notification.types";

interface Props {
  notification: Notification;
  onPress: (id: string) => void;
}

export default function NotificationItem({ notification, onPress }: Props) {
  const getIcon = (type: string) => {
    switch (type) {
      case "Task":
        return "check-square";
      case "Leave":
        return "calendar";
      case "Expense":
        return "dollar-sign";
      case "Project":
        return "briefcase";
      case "Incentive":
        return "award";
      case "Announcement":
        return "volume-2";
      default:
        return "bell";
    }
  };

  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity onPress={() => onPress(notification.id)} activeOpacity={0.7}>
      <Card style={{ backgroundColor: isUnread ? `${adminColors.primary}08` : adminColors.surface }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: isUnread ? `${adminColors.primary}20` : adminColors.background,
              marginRight: spacing.md,
            }}
          >
            <Feather
              name={getIcon(notification.notification_type)}
              size={18}
              color={isUnread ? adminColors.primary : adminColors.textSecondary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText weight={isUnread ? "700" : "600"} variant="body">
                {notification.title}
              </AppText>

              {isUnread && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: adminColors.primary,
                  }}
                />
              )}
            </View>

            <AppText
              variant="caption"
              color={adminColors.textSecondary}
              style={{ marginTop: spacing.xs }}
              numberOfLines={2}
            >
              {notification.message}
            </AppText>

            <AppText
              variant="caption"
              color={adminColors.textSecondary}
              style={{ marginTop: spacing.xs, fontSize: 11 }}
            >
              {new Date(notification.created_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </AppText>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
