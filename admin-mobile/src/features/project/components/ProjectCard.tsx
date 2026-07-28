import { View, TouchableOpacity, Pressable } from "react-native";
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
  <Pressable
  onPress={onPress}
  android_ripple={{ color: "transparent" }}
  style={({ pressed }) => [
    {
      transform: [{ scale: pressed ? 0.985 : 1 }],
      opacity: pressed ? 0.98 : 1,
      borderRadius: 24,
    },
  ]}
>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <AppText weight="700" variant="h3">
             Name : {project.project_name}
            </AppText>
            <AppText variant="caption" color={adminColors.textSecondary}>
              {project.project_code}
            </AppText>
          </View>
          <Badge label={project.status} color={getStatusColor(project.status)} />
        </View>

        {project.description ? (
          <AppText variant="caption" color={adminColors.textSecondary} numberOfLines={2} style={{ marginBottom: spacing.md }}>
         Description : {project.description}
          </AppText>
        ) : null}

      

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label={`${project.priority} Priority`} color={getPriorityColor(project.priority)} variant="subtle" />

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="users" size={14} color={adminColors.textSecondary} style={{ marginRight: 4 }} />
            <AppText variant="caption" color={adminColors.textSecondary}>
              {project.members?.length ?? 0} members
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
