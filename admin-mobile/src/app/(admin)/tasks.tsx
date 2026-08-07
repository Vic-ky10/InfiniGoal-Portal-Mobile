/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo, useEffect } from "react";
import { View, FlatList, TouchableOpacity, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState, ActionSheet, ActionSheetOption } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useTasks } from "@/features/task/hooks/useTasks";
import TaskCard from "@/features/task/components/TaskCard";
import TaskModal from "@/features/task/components/TaskModal";
import KanbanBoard from "@/features/task/components/KanbanBoard";
import { TaskWithProject, TaskFilters } from "@/features/task/task.types";
import { deleteTask } from "@/features/task/task.service";
import { toast } from "@/store/toast.store";
import TaskFilterBar from "@/features/task/components/TaskFilterBar";

const STATUS_FILTERS = ["All", "Todo", "In Progress", "Completed"];

type ViewMode = "list" | "kanban";

export default function TasksScreen() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean;
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    options: [],
  });

  const { tasks, loading, refreshing, refresh, handleUpdateStatus } = useTasks();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setTaskModalVisible(true);
      } else {
        toast.error("The requested task could not be found.");
      }
    }
  }, [taskId, tasks]);

  const projectsOptions = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    (tasks || []).forEach((t) => {
      if (t.project && !list.some((x) => x.id === t.project_id)) {
        list.push({ id: t.project_id, name: t.project.project_name });
      }
    });
    return list;
  }, [tasks]);

  const employeesOptions = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    (tasks || []).forEach((t) => {
      const member = t.member;
      if (member?.profile) {
        if (!list.some((x) => x.id === member.profile_id)) {
          list.push({ id: member.profile_id, name: member.profile.full_name });
        }
      }
    });
    return list;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((t) => {
      // Search matches Title, Code, Project, Member Name
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesSearch =
          t.title.toLowerCase().includes(s) ||
          t.task_code.toLowerCase().includes(s) ||
          (t.project?.project_name ?? "").toLowerCase().includes(s) ||
          (t.member?.profile?.full_name ?? "").toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      // Status
      if (filters.status && t.status !== filters.status) return false;

      // Priority
      if (filters.priority && t.priority !== filters.priority) return false;

      // Project
      if (filters.projectId && t.project_id !== filters.projectId) return false;

      // Employee (profileId)
      if (filters.profileId && t.member?.profile_id !== filters.profileId) return false;

      // Due Date (date)
      if (filters.date && t.due_date !== filters.date) return false;

      // Month
      if (filters.month && !t.due_date?.startsWith(filters.month)) return false;

      // Year
      if (filters.year && !t.due_date?.startsWith(filters.year)) return false;

      return true;
    });
  }, [tasks, filters]);

  const handleCreateNew = () => {
    setSelectedTask(null);
    setTaskModalVisible(true);
  };

  const handleEdit = (task: TaskWithProject) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  const handleDelete = (task: TaskWithProject) => {
    setActionSheetConfig({
      visible: true,
      title: "Delete Task",
      subtitle: `Are you sure you want to delete task "${task.title}" (${task.task_code})?`,
      options: [
        {
          label: "Delete",
          isDestructive: true,
          icon: "🗑",
          onPress: async () => {
            const res = await deleteTask(task.id);
            if (res.success) {
              toast.success(res.message || "Task deleted successfully.");
              refresh();
            } else {
              toast.error(res.error || "Failed to delete task.");
            }
          },
        },
      ],
    });
  };

  const handleTaskCardPress = (task: TaskWithProject) => {
    setActionSheetConfig({
      visible: true,
      title: task.title,
      subtitle: `Code: ${task.task_code}\nProject: ${task.project?.project_name ?? "N/A"}\nAssignee: ${task.member?.profile?.full_name ?? "Unassigned"}\nStatus: ${task.status}`,
      options: [
        {
          label: "Edit Task",
          icon: "✏️",
          onPress: () => handleEdit(task),
        },
        {
          label: "Delete Task",
          isDestructive: true,
          icon: "🗑",
          onPress: () => handleDelete(task),
        },
      ],
    });
  };

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
      style={{ padding: spacing.sm }}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        {/* Header */}
        <AppHeader
          title="Task Board"
          subtitle={`${tasks.length} tasks across projects`}
          rightComponent={
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              {/* View Toggle */}
              <View style={{
                flexDirection: "row",
                backgroundColor: adminColors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: adminColors.border,
                overflow: "hidden",
              }}>
                <TouchableOpacity
                  onPress={() => setViewMode("kanban")}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    backgroundColor: viewMode === "kanban" ? adminColors.primary : "transparent",
                  }}
                >
                  <Feather
                    name="columns"
                    size={15}
                    color={viewMode === "kanban" ? "#FFFFFF" : adminColors.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    backgroundColor: viewMode === "list" ? adminColors.primary : "transparent",
                  }}
                >
                  <Feather
                    name="list"
                    size={15}
                    color={viewMode === "list" ? "#FFFFFF" : adminColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Create button */}
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
                    web: { outlineStyle: "none" } as any,
                  }),
                }}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <AppText variant="caption" weight="700" color="#FFFFFF">
                  Create
                </AppText>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Enhanced Task Filter Bar */}
        <TaskFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          projects={projectsOptions}
          employees={employeesOptions}
          isAdmin
        />

        {/* Kanban View */}
        {viewMode === "kanban" ? (
          <KanbanBoard
            tasks={filteredTasks}
            isAdmin={true}
            profileId={null}
            onStatusChange={async (taskId, newStatus, actualHours) => {
              return handleUpdateStatus(taskId, newStatus, actualHours);
            }}
            onTaskDeleted={refresh}
            onTaskSaved={refresh}
            onCardPress={handleTaskCardPress}
          />
        ) : (
          /* List View */
          <>



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
          </>
        )}
      </View>

      <TaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onSuccess={refresh}
        taskToEdit={selectedTask}
      />

      <ActionSheet
        visible={actionSheetConfig.visible}
        onClose={() => setActionSheetConfig((prev) => ({ ...prev, visible: false }))}
        title={actionSheetConfig.title}
        subtitle={actionSheetConfig.subtitle}
        options={actionSheetConfig.options}
      />
    </Screen>
  );
}