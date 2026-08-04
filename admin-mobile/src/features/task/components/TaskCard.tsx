import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar } from "@/components/ui";
import { useThemeColors, spacing, radius, shadows } from "@/theme";
import { TaskWithProject } from "../task.types";

interface Props {
  task: TaskWithProject;
  onPress?: () => void;
  showAvatar?: boolean;
  showActions?: boolean;
  statusActions?: React.ReactNode;
}

export default function TaskCard({
  task,
  onPress,
  showAvatar = true,
  showActions = true,
  statusActions,
}: Props) {
  const colors = useThemeColors();
  const assigneeName = task.member?.profile?.full_name ?? "Unassigned";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return colors.success;
      case "In Progress":
        return colors.info;
      case "In Review":
        return colors.warning;
      case "Todo":
        return colors.disabled;
      default:
        return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return colors.danger;
      case "Medium":
        return colors.warning;
      case "Low":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const cardContent = (
    <Card
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        ...shadows.sm,
        padding: spacing.md,
        backgroundColor: colors.background,
      }}
    >
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.md,
              backgroundColor: `${colors.primary}10`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="check-square" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body" color={colors.text}>
              {task.title}
            </AppText>
          </View>
        </View>
        <Badge label={task.status} color={getStatusColor(task.status)} />
      </View>

      {/* MIDDLE */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        {task.project && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Feather name="briefcase" size={12} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} weight="600">
              Project: {task.project.project_name}
            </AppText>
          </View>
        )}

        {task.description ? (
          <AppText
            variant="caption"
            color={colors.textSecondary}
            numberOfLines={2}
            style={{ marginTop: 2, lineHeight: 18 }}
          >
            {task.description}
          </AppText>
        ) : null}
      </View>

      {/* FOOTER */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: `${colors.border}80`,
          paddingTop: spacing.sm,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {showAvatar && (
            <>
              <Avatar name={assigneeName} size={20} />
              <AppText variant="caption" color={colors.textSecondary}>
                {assigneeName}
              </AppText>
            </>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Badge
            label={task.priority}
            color={getPriorityColor(task.priority)}
            variant="subtle"
          />
          {task.due_date && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Feather name="calendar" size={12} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary}>
                {task.due_date}
              </AppText>
            </View>
          )}
        </View>
      </View>

      {/* ACTIONS */}
      {showActions && statusActions && (
        <View style={{ marginTop: spacing.md }}>
          {statusActions}
        </View>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: `${colors.primary}10` }}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}
