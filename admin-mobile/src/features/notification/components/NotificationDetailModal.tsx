import { Modal, Pressable, ScrollView, View, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Card, Badge } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { Notification } from "../notification.types";

interface Props {
  visible: boolean;
  notification: Notification | null;
  onClose: () => void;
  colors: typeof adminColors;
}

const getRelativeTime = (date: string) => {
  const now = new Date();
  const created = new Date(date);

  const diff = now.getTime() - created.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return created.toLocaleDateString();
};

const getIcon = (type: string): string => {
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

export default function NotificationDetailModal({
  visible,
  notification,
  onClose,
  colors
}: Props) {
  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          padding: spacing.lg,
          ...Platform.select({
            web: {
              outlineStyle: "none",
            } as any,
          }),
        }}
      >
        <Pressable
          style={{
            ...Platform.select({
              web: {
                outlineStyle: "none",
              } as any,
            }),
          }}
        >

          <Card
            style={{
              borderRadius: radius.xl,
              padding: spacing.xl,
              borderWidth: 0,
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: `${colors.primary}15`,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Feather
                  name={getIcon(notification.notification_type)}
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Badge
                label={notification.notification_type}
                color={colors.primary}
                variant="subtle"
              />
            </View>

            <AppText
              variant="h3"
              weight="700"
              style={{
                textAlign: "center",
                marginBottom: spacing.sm,
              }}
            >
              {notification.title}
            </AppText>

            <AppText
              variant="caption"
              color={colors.textSecondary}
              style={{
                textAlign: "center",
                marginBottom: spacing.lg,
              }}
            >
              {getRelativeTime(notification.created_at)}
            </AppText>

            <ScrollView
              style={{
                maxHeight: 220,
              }}
              showsVerticalScrollIndicator={false}
            >
              <AppText
                style={{
                  lineHeight: 24,
                }}
              >
                {notification.message}
              </AppText>
            </ScrollView>

            <View
              style={{
                marginTop: spacing.xl,
              }}
            >
              <Button title="Close" onPress={onClose} />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
