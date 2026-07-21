import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { ProjectWithMembers } from "../project.types";

interface Props {
  project: ProjectWithMembers;
  onPress?: () => void;
}

export default function ProjectCard({ project, onPress }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return adminColors.primary;
      case "Completed":
        return adminColors.success;
      case "On Hold":
        return adminColors.warning;
      case "Archived":
        return adminColors.disabled;
      default:
        return adminColors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return adminColors.danger;
      case "Medium":
        return adminColors.warning;
      case "Low":
        return adminColors.info;
      default:
        return adminColors.textSecondary;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <AppText weight="700" variant="h3">
              {project.project_name}
            </AppText>
            <AppText variant="caption" color={adminColors.textSecondary}>
              {project.project_code}
            </AppText>
          </View>
          <Badge label={project.status} color={getStatusColor(project.status)} />
        </View>

        {project.description ? (
          <AppText variant="caption" color={adminColors.textSecondary} numberOfLines={2} style={{ marginBottom: spacing.md }}>
            {project.description}
          </AppText>
        ) : null}

        {/* Progress Bar */}
        <View style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <AppText variant="caption" color={adminColors.textSecondary}>Progress</AppText>
            <AppText variant="caption" weight="700" color={adminColors.primary}>
              {project.progress ?? 0}%
            </AppText>
          </View>
          <View style={{ height: 6, backgroundColor: adminColors.border, borderRadius: radius.full, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, project.progress ?? 0))}%`,
                backgroundColor: adminColors.primary,
                borderRadius: radius.full,
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label={`${project.priority} Priority`} color={getPriorityColor(project.priority)} variant="subtle" />

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="users" size={14} color={adminColors.textSecondary} style={{ marginRight: 4 }} />
            <AppText variant="caption" color={adminColors.textSecondary}>
              {project.members?.length ?? 0} member(s)
            </AppText>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
