import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge } from "@/components/ui";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { ProjectWithMembers } from "../project.types";

interface Props {
  project: ProjectWithMembers;
  onPress?: () => void;
  showMetadata?: boolean;
  showRoleInfo?: boolean;
  memberRole?: string;
  assignedDate?: string;
}

export default function ProjectCard({
  project,
  onPress,
  showMetadata = true,
  showRoleInfo = false,
  memberRole,
  assignedDate,
}: Props) {
  const colors = useThemeColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return colors.primary;
      case "Completed":
        return colors.success;
      case "On Hold":
        return colors.warning;
      case "Archived":
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
            <Feather name="briefcase" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body" color={colors.text}>
              {project.project_name}
            </AppText>
          </View>
        </View>
        <Badge label={project.status} color={getStatusColor(project.status)} />
      </View>

      {/* MIDDLE */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        {project.description ? (
          <AppText
            variant="caption"
            color={colors.textSecondary}
            numberOfLines={2}
            style={{ lineHeight: 18 }}
          >
            {project.description}
          </AppText>
        ) : null}

        {showMetadata && (project.start_date || project.end_date) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 4 }}>
            <Feather name="calendar" size={12} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} weight="600">
              Timeline: {project.start_date || "--"} to {project.end_date || "--"}
            </AppText>
          </View>
        )}

        {showRoleInfo && (memberRole || assignedDate) && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: spacing.xs,
              marginTop: 4,
              backgroundColor: `${colors.primary}08`,
              padding: spacing.xs,
              borderRadius: radius.sm,
            }}
          >
            {memberRole && (
              <Badge label={`Role: ${memberRole}`} color={colors.primary} variant="subtle" />
            )}
            {assignedDate && (
              <AppText variant="caption" color={colors.textSecondary}>
                Assigned: {assignedDate.split("T")[0]}
              </AppText>
            )}
          </View>
        )}
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
        <Badge
          label={`${project.priority} Priority`}
          color={getPriorityColor(project.priority)}
          variant="subtle"
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="users" size={12} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            {project.members?.length ?? 0} members
          </AppText>
        </View>
      </View>
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
