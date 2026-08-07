/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { AppText, Screen, Card, Badge, Button } from "@/components/ui";
import {
  AppHeader,
  SearchBar,
  EmptyState,
  ActionSheet,
  ActionSheetOption,
} from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { TaskWithProject, TaskFilters } from "@/features/task/task.types";
import { getEmployeeTasks, updateTaskStatus } from "@/features/task/task.service";
import { toast } from "@/store/toast.store";
import TaskCard from "@/features/task/components/TaskCard";
import KanbanBoard from "@/features/task/components/KanbanBoard";
import TaskFilterBar from "@/features/task/components/TaskFilterBar";

type ViewMode = "list" | "kanban";

export default function EmployeeTasksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setDetailModalVisible(true);
      } else {
        toast.error("The requested task could not be found.");
      }
    }
  }, [taskId, tasks]);
  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean;
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    options: [],
  });

  const pulseAnim = useMemo(() => new Animated.Value(0.4), []);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading, pulseAnim]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);
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
    Promise.resolve().then(() => {
      loadData();
    });

    // Subscribe to realtime task updates
    const channel = supabase
      .channel("realtime-tasks-employee")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Optimistic update helper
  const applyOptimisticUpdate = (taskId: string, newStatus: string, actualHours?: number) => {
    const completedAt = newStatus === "Completed" ? new Date().toISOString() : undefined;
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus as TaskWithProject["status"],
              ...(completedAt ? { completed_at: completedAt } : {}),
              ...(actualHours !== undefined ? { actual_hours: actualHours } : {}),
            }
          : t
      );
      const found = updated.find((t) => t.id === taskId);
      if (found && selectedTask?.id === taskId) {
        setSelectedTask(found);
      }
      return updated;
    });
  };

  // Kanban status change handler — same permission logic as list view
  const handleKanbanStatusChange = useCallback(
    async (taskId: string, newStatus: string, actualHours?: number) => {
      applyOptimisticUpdate(taskId, newStatus, actualHours);
      setUpdatingTaskId(taskId);
      try {
        const res = await updateTaskStatus(taskId, newStatus, actualHours);
        if (!res.success) {
          toast.error(res.error || "Failed to update task status.");
          await loadData(true);
          return { success: false, error: res.error };
        }
        return { success: true, message: res.message };
      } finally {
        setUpdatingTaskId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadData]
  );

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // If completing, show a simple confirmation action sheet
    if (newStatus === "Completed") {
      setActionSheetConfig({
        visible: true,
        title: "Confirm Completion",
        subtitle: "Are you sure you want to mark this task as completed?",
        options: [
          {
            label: "Yes, Complete Task",
            icon: "✔",
            onPress: async () => {
              applyOptimisticUpdate(taskId, newStatus);
              setUpdatingTaskId(taskId);
              try {
                const res = await updateTaskStatus(taskId, newStatus);
                if (!res.success) {
                  toast.error(res.error || "Failed to update task status.");
                  await loadData(true);
                }
              } finally {
                setUpdatingTaskId(null);
              }
            },
          },
        ],
      });
    } else {
      applyOptimisticUpdate(taskId, newStatus);
      setUpdatingTaskId(taskId);
      try {
        const res = await updateTaskStatus(taskId, newStatus);
        if (!res.success) {
          toast.error(res.error || "Failed to update task status.");
          await loadData(true);
        }
      } finally {
        setUpdatingTaskId(null);
      }
    }
  };

  const projectsOptions = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    tasks.forEach((t) => {
      if (t.project && !list.some((x) => x.id === t.project_id)) {
        list.push({ id: t.project_id, name: t.project.project_name });
      }
    });
    return list;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesSearch =
          t.title.toLowerCase().includes(s) ||
          t.task_code.toLowerCase().includes(s) ||
          (t.project?.project_name ?? "").toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.projectId && t.project_id !== filters.projectId) return false;
      if (filters.date && t.due_date !== filters.date) return false;
      if (filters.month && !t.due_date?.startsWith(filters.month)) return false;
      if (filters.year && !t.due_date?.startsWith(filters.year)) return false;

      return true;
    });
  }, [tasks, filters]);

  const openDetails = (task: TaskWithProject) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const renderTaskItem = ({ item }: { item: TaskWithProject }) => {
    const isCompleted = item.status === "Completed";
    const isInProgress = item.status === "In Progress";
    const isTodo = item.status === "Todo";
    const isUpdating = updatingTaskId === item.id;

    return (
      <View style={{ marginBottom: spacing.md }}>
        <TaskCard
          task={item}
          onPress={() => openDetails(item)}
          showAvatar={false}
          showActions={true}
          statusActions={
            !isCompleted ? (
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {isTodo ? (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item.id, "In Progress")}
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      backgroundColor: `${employeeColors.info}10`,
                      borderWidth: 1.5,
                      borderColor: employeeColors.info,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    <AppText variant="caption" weight="700" color={employeeColors.info}>
                      {isUpdating ? "Starting..." : "Start Task"}
                    </AppText>
                  </TouchableOpacity>
                ) : isInProgress ? (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item.id, "Completed")}
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      backgroundColor: `${employeeColors.primary}10`,
                      borderWidth: 1.5,
                      borderColor: employeeColors.primary,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="700"
                      color={employeeColors.primary}
                    >
                      {isUpdating ? "Completing..." : "Mark Complete"}
                    </AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Feather
                  name="check-circle"
                  size={13}
                  color={employeeColors.success}
                />
                <AppText
                  variant="caption"
                  weight="700"
                  color={employeeColors.success}
                >
                  Completed{" "}
                  {item.completed_at
                    ? `on: ${new Date(item.completed_at).toLocaleDateString()}`
                    : ""}
                </AppText>
              </View>
            )
          }
        />
      </View>
    );
  };

  const renderSkeletonItem = () => (
    <Animated.View style={{ opacity: pulseAnim }}>
      <Card
        style={{
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: employeeColors.border,
          height: 160,
          gap: spacing.md,
          padding: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View
            style={{
              width: 80,
              height: 16,
              backgroundColor: `${employeeColors.border}60`,
              borderRadius: radius.sm,
            }}
          />
          <View
            style={{
              width: 60,
              height: 16,
              backgroundColor: `${employeeColors.border}60`,
              borderRadius: radius.sm,
            }}
          />
        </View>
        <View
          style={{
            width: "80%",
            height: 20,
            backgroundColor: `${employeeColors.border}60`,
            borderRadius: radius.sm,
          }}
        />
        <View
          style={{
            width: "100%",
            height: 14,
            backgroundColor: `${employeeColors.border}60`,
            borderRadius: radius.sm,
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View
            style={{
              width: 120,
              height: 12,
              backgroundColor: `${employeeColors.border}60`,
              borderRadius: radius.sm,
            }}
          />
          <View
            style={{
              width: 40,
              height: 12,
              backgroundColor: `${employeeColors.border}60`,
              borderRadius: radius.sm,
            }}
          />
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <Screen isLoading={false} scroll={false} style={{ padding: spacing.sm }}>
      <View style={{ flex: 1, gap: spacing.md }}>
        {/* Header with view toggle */}
        <AppHeader
          title="My Tasks"
          subtitle="Tasks assigned to you"
          rightComponent={
            <View style={{
              flexDirection: "row",
              backgroundColor: `${employeeColors.primary}10`,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: `${employeeColors.primary}30`,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                onPress={() => setViewMode("kanban")}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  backgroundColor: viewMode === "kanban" ? employeeColors.primary : "transparent",
                }}
              >
                <Feather
                  name="columns"
                  size={15}
                  color={viewMode === "kanban" ? "#FFFFFF" : employeeColors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  backgroundColor: viewMode === "list" ? employeeColors.primary : "transparent",
                }}
              >
                <Feather
                  name="list"
                  size={15}
                  color={viewMode === "list" ? "#FFFFFF" : employeeColors.primary}
                />
              </TouchableOpacity>
            </View>
          }
        />

        {/* Enhanced Task Filter Bar */}
        <TaskFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          projects={projectsOptions}
        />

        {/* Kanban View */}
        {viewMode === "kanban" ? (
          loading ? (
            <FlatList
              data={[1, 2, 3, 4]}
              keyExtractor={(i) => String(i)}
              renderItem={renderSkeletonItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xxxl }}
            />
          ) : (
            <KanbanBoard
              tasks={filteredTasks}
              isAdmin={false}
              profileId={currentUserId}
              onStatusChange={handleKanbanStatusChange}
              onTaskDeleted={() => loadData(true)}
              onCardPress={openDetails}
            />
          )
        ) : (
          /* List View */
          <>


            {loading ? (
              <FlatList
                data={[1, 2, 3, 4]}
                keyExtractor={(i) => String(i)}
                renderItem={renderSkeletonItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.xxxl }}
              />
            ) : (
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
            )}
          </>
        )}

        {/* Task Details Sheet Modal */}
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                padding: spacing.xl,
                maxHeight: "85%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.lg,
                }}
              >
                <AppText variant="h2" weight="700">
                  Task Details
                </AppText>
                <TouchableOpacity
                  onPress={() => {
                    setDetailModalVisible(false);
                    setSelectedTask(null);
                  }}
                >
                  <Feather name="x" size={24} color={employeeColors.text} />
                </TouchableOpacity>
              </View>

              {selectedTask && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.lg }}
                >
                  <View style={{ gap: spacing.xs }}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: spacing.xs,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Badge
                        label={selectedTask.task_code}
                        color={employeeColors.primary}
                        variant="subtle"
                      />
                      <Badge
                        label={selectedTask.status}
                        color={
                          selectedTask.status === "Completed"
                            ? employeeColors.success
                            : selectedTask.status === "In Progress"
                            ? employeeColors.info
                            : employeeColors.warning
                        }
                      />
                      <Badge
                        label={`${selectedTask.priority} Priority`}
                        color={
                          selectedTask.priority === "High" ||
                          selectedTask.priority === "Urgent"
                            ? employeeColors.danger
                            : employeeColors.textSecondary
                        }
                        variant="subtle"
                      />
                    </View>
                    <AppText
                      variant="h2"
                      weight="700"
                      color={employeeColors.text}
                      style={{ marginTop: spacing.xs }}
                    >
                      {selectedTask.title}
                    </AppText>
                  </View>

                  {/* Project Summary */}
                  {selectedTask.project && (
                    <View
                      style={{ gap: spacing.xs, paddingVertical: spacing.xs }}
                    >
                      <AppText
                        variant="caption"
                        weight="600"
                        color={employeeColors.textSecondary}
                      >
                        PROJECT
                      </AppText>
                      <AppText weight="700">
                        {selectedTask.project.project_name}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={employeeColors.textSecondary}
                      >
                        Code: {selectedTask.project.project_code}
                      </AppText>
                    </View>
                  )}

                  {/* Task Details Stack */}
                  <Card
                    style={{
                      borderWidth: 1,
                      borderColor: employeeColors.border,
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        borderBottomWidth: 1,
                        borderBottomColor: `${employeeColors.border}50`,
                        paddingBottom: spacing.sm,
                      }}
                    >
                      <View>
                        <AppText
                          variant="caption"
                          color={employeeColors.textSecondary}
                        >
                          Assigned Date
                        </AppText>
                        <AppText weight="600" style={{ marginTop: 2 }}>
                          {selectedTask.created_at
                            ? new Date(
                                selectedTask.created_at
                              ).toLocaleDateString()
                            : "--"}
                        </AppText>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <AppText
                          variant="caption"
                          color={employeeColors.textSecondary}
                        >
                          Due Date
                        </AppText>
                        <AppText
                          weight="600"
                          color={employeeColors.danger}
                          style={{ marginTop: 2 }}
                        >
                          {selectedTask.due_date || "--"}
                        </AppText>
                      </View>
                    </View>

                    <View style={{ gap: spacing.sm }}>
                      {selectedTask.completed_at !== null &&
                        selectedTask.completed_at !== undefined && (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <AppText
                              variant="body"
                              color={employeeColors.textSecondary}
                            >
                              Completed At
                            </AppText>
                            <AppText weight="600" color={employeeColors.success}>
                              {new Date(
                                selectedTask.completed_at
                              ).toLocaleString()}
                            </AppText>
                          </View>
                        )}

                      {selectedTask.created_by && (
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <AppText
                            variant="body"
                            color={employeeColors.textSecondary}
                          >
                            Assigned By
                          </AppText>
                          <AppText
                            variant="caption"
                            weight="600"
                            color={employeeColors.textSecondary}
                          >
                            {selectedTask.member?.profile?.full_name
                              ? "Administrator"
                              : "Manager"}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </Card>

                  {/* Description */}
                  {selectedTask.description ? (
                    <View style={{ gap: spacing.xs }}>
                      <AppText
                        variant="caption"
                        weight="600"
                        color={employeeColors.textSecondary}
                      >
                        NOTES & DESCRIPTION
                      </AppText>
                      <Card
                        style={{
                          borderWidth: 1,
                          borderColor: employeeColors.border,
                        }}
                      >
                        <AppText
                          variant="body"
                          color={employeeColors.text}
                          style={{ lineHeight: 22 }}
                        >
                          {selectedTask.description}
                        </AppText>
                      </Card>
                    </View>
                  ) : null}

                  {/* Actions inside Detail Sheet */}
                  {selectedTask.status !== "Completed" ? (
                    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                      {selectedTask.status === "Todo" ? (
                        <Button
                          title="Start Working on Task"
                          onPress={() =>
                            handleStatusChange(selectedTask.id, "In Progress")
                          }
                          loading={updatingTaskId === selectedTask.id}
                        />
                      ) : selectedTask.status === "In Progress" ? (
                        <Button
                          title="Mark Task Completed"
                          onPress={() =>
                            handleStatusChange(selectedTask.id, "Completed")
                          }
                          loading={updatingTaskId === selectedTask.id}
                        />
                      ) : null}
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: `${employeeColors.success}10`,
                        alignItems: "center",
                        paddingVertical: spacing.md,
                        marginTop: spacing.md,
                        borderRadius: 10,
                      }}
                    >
                      <AppText weight="700" color={employeeColors.success}>
                        ✔ Completed{" "}
                        {selectedTask.completed_at
                          ? `on: ${new Date(
                              selectedTask.completed_at
                            ).toLocaleDateString()}`
                          : ""}
                      </AppText>
                    </View>
                  )}
                  <View style={{ height: spacing.xl }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>

      <ActionSheet
        visible={actionSheetConfig.visible}
        onClose={() =>
          setActionSheetConfig((prev) => ({ ...prev, visible: false }))
        }
        title={actionSheetConfig.title}
        subtitle={actionSheetConfig.subtitle}
        options={actionSheetConfig.options}
        cancelText="No, Cancel"
      />
    </Screen>
  );
}
