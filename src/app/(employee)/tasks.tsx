import { useState, useEffect, useCallback } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { TaskWithProject, TASK_STATUS } from "@/features/task/task.types";
import { getEmployeeTasks, updateTaskStatus } from "@/features/task/task.service";

export default function EmployeeTasksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getEmployeeTasks(user.id);
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const res = await updateTaskStatus(taskId, newStatus);
    if (res.success) {
      Alert.alert("Success", "Task status updated.");
      loadData(true);
    } else {
      Alert.alert("Error", res.error);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status.toUpperCase() === statusFilter;
  });

  const renderTaskItem = ({ item }: { item: TaskWithProject }) => (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label={item.task_code} color={employeeColors.primary} variant="subtle" />
          <Badge
            label={item.status}
            color={
              item.status === "Completed"
                ? employeeColors.primary
                : item.status === "In Progress"
                ? employeeColors.info
                : employeeColors.warning
            }
          />
        </View>

        <AppText weight="700" variant="h3" style={{ marginTop: spacing.xs }}>
          {item.title}
        </AppText>

        {item.project && (
          <AppText variant="caption" color={employeeColors.textSecondary}>
            Project: {item.project.project_name} ({item.project.project_code})
          </AppText>
        )}

        {item.description && (
          <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.xs }}>
            {item.description}
          </AppText>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm }}>
          <AppText variant="caption" color={employeeColors.textSecondary}>
            Priority: {item.priority} | Due: {item.due_date}
          </AppText>
        </View>

        {/* Status Action Buttons */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}>
          {item.status !== "In Progress" && item.status !== "Completed" && (
            <TouchableOpacity
              onPress={() => handleStatusChange(item.id, TASK_STATUS.IN_PROGRESS)}
              style={{
                flex: 1,
                paddingVertical: spacing.xs,
                backgroundColor: `${employeeColors.info}15`,
                borderWidth: 1,
                borderColor: employeeColors.info,
                borderRadius: radius.md,
                alignItems: "center",
              }}
            >
              <AppText variant="caption" weight="700" color={employeeColors.info}>
                Start Task
              </AppText>
            </TouchableOpacity>
          )}

          {item.status !== "Completed" && (
            <TouchableOpacity
              onPress={() => handleStatusChange(item.id, TASK_STATUS.COMPLETED)}
              style={{
                flex: 1,
                paddingVertical: spacing.xs,
                backgroundColor: `${employeeColors.primary}15`,
                borderWidth: 1,
                borderColor: employeeColors.primary,
                borderRadius: radius.md,
                alignItems: "center",
              }}
            >
              <AppText variant="caption" weight="700" color={employeeColors.primary}>
                Mark Complete
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="My Tasks" subtitle="Tasks assigned to you" />

        {/* Filter Pills */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.md,
                backgroundColor: statusFilter === status ? employeeColors.primary : `${employeeColors.primary}10`,
              }}
            >
              <AppText variant="caption" weight="600" color={statusFilter === status ? "#FFFFFF" : employeeColors.primary}>
                {status.replace("_", " ")}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Tasks Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
