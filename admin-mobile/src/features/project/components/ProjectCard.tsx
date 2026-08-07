import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
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
      case "Active":    return colors.primary;
      case "Completed": return colors.success;
      case "On Hold":   return colors.warning;
      case "Archived":  return colors.disabled;
      case "Cancelled": return colors.danger;
      default:          return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":   return colors.danger;
      case "Medium": return colors.warning;
      case "Low":    return colors.success;
      default:       return colors.textSecondary;
    }
  };

  const progress = Math.min(Math.max(project.progress ?? 0, 0), 100);

  const progressColor =
    progress === 100
      ? "#22C55E"
      : progress >= 50
      ? "#2563EB"
      : "#F59E0B";

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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: `${colors.primary}10` },
            ]}
          >
            <Feather name="briefcase" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body" color={colors.text}>
              {project.project_name}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {project.project_code}
            </AppText>
          </View>
        </View>
        <Badge label={project.status} color={getStatusColor(project.status)} />
      </View>

      {/* DESCRIPTION */}
      {project.description ? (
        <AppText
          variant="caption"
          color={colors.textSecondary}
          numberOfLines={2}
          style={{ lineHeight: 18, marginBottom: spacing.sm }}
        >
          {project.description}
        </AppText>
      ) : null}

      {/* PROGRESS BAR */}
      <View style={{ marginBottom: spacing.sm }}>
        <View style={styles.progressHeader}>
          <AppText variant="caption" color={colors.textSecondary}>
            Progress
          </AppText>
          <AppText variant="caption" weight="700" color={progressColor}>
            {progress}%
          </AppText>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: `${colors.border}80` }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%` as any,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>

      {/* TIMELINE */}
      {showMetadata && (project.start_date || project.end_date) && (
        <View style={styles.metaRow}>
          <Feather name="calendar" size={12} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} weight="600">
            {project.start_date || "--"} → {project.end_date || "Ongoing"}
          </AppText>
        </View>
      )}

      {/* ROLE INFO (employee view) */}
      {showRoleInfo && (memberRole || assignedDate) && (
        <View
          style={[
            styles.roleRow,
            { backgroundColor: `${colors.primary}08`, borderRadius: radius.sm },
          ]}
        >
          {memberRole && (
            <Badge
              label={`Role: ${memberRole}`}
              color={colors.primary}
              variant="subtle"
            />
          )}
          {assignedDate && (
            <AppText variant="caption" color={colors.textSecondary}>
              Assigned: {assignedDate.split("T")[0]}
            </AppText>
          )}
        </View>
      )}

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: `${colors.border}80` }]}>
        <Badge
          label={`${project.priority} Priority`}
          color={getPriorityColor(project.priority)}
          variant="subtle"
        />

        <View style={styles.memberCount}>
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 4,
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
