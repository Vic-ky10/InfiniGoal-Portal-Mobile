import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar } from "@/components/ui";
import { adminColors, spacing } from "@/theme";
import { TaskWithProject } from "../task.types";

interface Props {
  task: TaskWithProject;
  onPress?: () => void;
}

export default function TaskCard({ task, onPress }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return adminColors.success;
      case "In Progress":
        return adminColors.primary;
      case "In Review":
        return adminColors.warning;
      case "Todo":
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

  const assigneeName = task.member?.profile?.full_name ?? "Unassigned";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <AppText weight="700" variant="body">
              {task.title}
            </AppText>
            <AppText variant="caption" color={adminColors.textSecondary}>
              {task.task_code} {task.project?.project_name ? `• ${task.project.project_name}` : ""}
            </AppText>
          </View>
          <Badge label={task.status} color={getStatusColor(task.status)} />
        </View>

        {task.description ? (
          <AppText variant="caption" color={adminColors.textSecondary} numberOfLines={2} style={{ marginBottom: spacing.md }}>
            {task.description}
          </AppText>
        ) : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar name={assigneeName} size={24} />
            <AppText variant="caption" color={adminColors.textSecondary} style={{ marginLeft: spacing.xs }}>
              {assigneeName}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Badge label={task.priority} color={getPriorityColor(task.priority)} variant="subtle" />
            {task.due_date && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="calendar" size={12} color={adminColors.textSecondary} style={{ marginRight: 2 }} />
                <AppText variant="caption" color={adminColors.textSecondary}>
                  {task.due_date}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
