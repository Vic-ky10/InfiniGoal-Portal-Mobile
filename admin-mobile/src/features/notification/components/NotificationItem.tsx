import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { Notification } from "../notification.types";



interface Props {
  notification: Notification;
  onPress: (notification: Notification) => void;
  colors: typeof adminColors;
}

const getRelativeTime = (date: string) => {
  const now = new Date();
  const created = new Date(date);

  const diff =
    now.getTime() - created.getTime();

  const minutes = Math.floor(
    diff / (1000 * 60)
  );

  const hours = Math.floor(minutes / 60);

  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";

  if (minutes < 60)
    return `${minutes} min ago`;

  if (hours < 24)
    return `${hours} hr ago`;

  if (days === 1) return "Yesterday";

  if (days < 7)
    return `${days} days ago`;

  return created.toLocaleDateString();
};

export default function NotificationItem({ notification, onPress , colors }: Props) {
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
  <Pressable
  onPress={() => onPress(notification)}
  android_ripple={{ color: "transparent" }}
  style={({ pressed }) => [
  {
    opacity: 1,
    transform: [{ scale: pressed ? 0.985 : 1 }],
    backgroundColor: pressed
      ? `${adminColors.primary}10`
      : "transparent",
  },
]}
>
    <Card
      style={{
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: isUnread
          ? `${colors.primary}08`
          : colors.surface,
        borderWidth: 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        {/* Icon */}

        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor:
              `${colors.primary}15`,
            justifyContent: "center",
            alignItems: "center",
            marginRight: spacing.md,
          }}
        >
          <Feather
            name={getIcon(
              notification.notification_type
            )}
            size={22}
            color={colors.primary}
          />
        </View>

        {/* Content */}

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <AppText
              weight={
                isUnread ? "700" : "600"
              }
              variant="body"
              style={{ flex: 1 }}
            >
              {notification.title}
            </AppText>

            {isUnread && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor:
                    colors.primary,
                }}
              />
            )}
          </View>

          <AppText
            numberOfLines={2}
            color={colors.textSecondary}
            style={{
              marginTop: spacing.xs,
              lineHeight: 20,
            }}
          >
            {notification.message}
          </AppText>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginTop: spacing.md,
            }}
          >
            <Badge
              label={
                notification.notification_type
              }
              color={colors.primary}
              variant="subtle"
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Feather
                name="clock"
                size={12}
                color={
                  colors.textSecondary
                }
              />

              <AppText
                variant="caption"
                color={
                  colors.textSecondary
                }
                style={{
                  marginLeft: 4,
                }}
              >
                {getRelativeTime(
                  notification.created_at
                )}
              </AppText>

              <Feather
                name="chevron-right"
                size={16}
                color={
                  colors.textSecondary
                }
                style={{
                  marginLeft: spacing.sm,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Card>
  </Pressable>
);
}
