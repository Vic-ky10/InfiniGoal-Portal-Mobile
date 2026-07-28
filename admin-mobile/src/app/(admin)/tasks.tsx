import { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useTasks } from "@/features/task/hooks/useTasks";
import TaskCard from "@/features/task/components/TaskCard";
import TaskModal from "@/features/task/components/TaskModal";
import { TaskWithProject } from "@/features/task/task.types";
import { deleteTask } from "@/features/task/task.service";

const STATUS_FILTERS = ["All", "Todo", "In Progress", "In Review", "Completed"];

export default function TasksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);

  const { tasks, loading, refreshing, refresh } = useTasks();

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.task_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.project?.project_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.member?.profile?.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const handleCreateNew = () => {
    setSelectedTask(null);
    setTaskModalVisible(true);
  };

  const handleEdit = (task: TaskWithProject) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  const handleDelete = (task: TaskWithProject) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete task "${task.title}" (${task.task_code})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteTask(task.id);
            if (res.success) {
               Alert.alert("Success", res.message);
               refresh();
            } else {
               Alert.alert("Error", res.error || "Failed to delete task.");
            }
          },
        },
      ]
    );
  };

  const handleTaskCardPress = (task: TaskWithProject) => {
    Alert.alert(
      task.title,
      `Code: ${task.task_code}\nProject: ${task.project?.project_name ?? "N/A"}\nAssignee: ${task.member?.profile?.full_name ?? "Unassigned"}\nStatus: ${task.status}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit Task",
          onPress: () => handleEdit(task),
        },
        {
          text: "Delete Task",
          style: "destructive",
          onPress: () => handleDelete(task),
        },
      ]
    );
  };

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Task Board"
          subtitle={`${tasks.length} tasks across projects`}
          rightComponent={
            <TouchableOpacity
              onPress={handleCreateNew}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: adminColors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.md,
                gap: 4,
                ...Platform.select({
                  web: {
                    outlineStyle: "none",
                  } as any,
                }),
              }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                Create
              </AppText>
            </TouchableOpacity>
          }
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filters */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
          {STATUS_FILTERS.map((status) => {
            const isSelected = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? adminColors.primary : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? adminColors.primary : adminColors.border,
                  ...Platform.select({
                    web: {
                      outlineStyle: "none",
                    } as any,
                  }),
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {status}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tasks List */}
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredTasks.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No tasks found." />}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskCardPress(item)}
            />
          )}
        />
      </View>

      <TaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onSuccess={refresh}
        taskToEdit={selectedTask}
      />
    </Screen>
  );
}