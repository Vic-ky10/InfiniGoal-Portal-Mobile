import { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, TouchableOpacity, Alert, Modal, ScrollView, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText, Screen, Card, Badge, Button } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { employeeColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { TaskWithProject, TASK_STATUS } from "@/features/task/task.types";
import { getEmployeeTasks, updateTaskStatus } from "@/features/task/task.service";

export default function EmployeeTasksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Pulse animation for loading skeletons
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

  const applyOptimisticUpdate = (taskId: string, newStatus: string) => {
    const completedAt = newStatus === "Completed" ? new Date().toISOString() : undefined;
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, ...(completedAt ? { completed_at: completedAt } : {}) }
          : t
      );
      const found = updated.find((t) => t.id === taskId);
      if (found && selectedTask?.id === taskId) {
        setSelectedTask(found);
      }
      return updated;
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (newStatus === "Completed") {
      Alert.alert(
        "Confirm Completion",
        "Are you sure you want to mark this task as completed?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              // Optimistic update first — UI transitions instantly
              applyOptimisticUpdate(taskId, newStatus);
              setUpdatingTaskId(taskId);
              try {
                const res = await updateTaskStatus(taskId, newStatus);
                if (!res.success) {
                  // Rollback: fetch real state from DB only on failure
                  Alert.alert("Error", res.error);
                  await loadData(true);
                }
                // On success: do nothing — local state is already correct
              } finally {
                setUpdatingTaskId(null);
              }
            },
          },
        ]
      );
    } else {
      // Optimistic update first — UI transitions instantly
      applyOptimisticUpdate(taskId, newStatus);
      setUpdatingTaskId(taskId);
      try {
        const res = await updateTaskStatus(taskId, newStatus);
        if (!res.success) {
          // Rollback: fetch real state from DB only on failure
          Alert.alert("Error", res.error);
          await loadData(true);
        }
        // On success: do nothing — local state is already correct
      } finally {
        setUpdatingTaskId(null);
      }
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          t.task_code.toLowerCase().includes(q) ||
          (t.project?.project_name ?? "").toLowerCase().includes(q)
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Dynamic Filter Pills
    switch (statusFilter) {
      case "PENDING":
        return result.filter((t) => t.status === "Todo");
      case "IN_PROGRESS":
        return result.filter((t) => t.status === "In Progress");
      case "COMPLETED":
        return result.filter((t) => t.status === "Completed");
      case "OVERDUE":
        return result.filter(
          (t) =>
            t.status !== "Completed" &&
            t.due_date &&
            t.due_date < todayStr
        );
      case "HIGH_PRIORITY":
        return result.filter((t) => t.priority === "High" || t.priority === "Urgent");
      case "TODAY":
        return result.filter((t) => t.due_date === todayStr);
      case "THIS_WEEK":
        return result.filter((t) => {
          if (!t.due_date) return false;
          const due = new Date(t.due_date);
          return due >= today && due <= nextWeek;
        });
      default:
        return result;
    }
  }, [tasks, searchQuery, statusFilter]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Urgent":
      case "High":
        return <Feather name="alert-circle" size={12} color={employeeColors.danger} />;
      case "Medium":
        return <Feather name="minus-circle" size={12} color={employeeColors.warning} />;
      case "Low":
      default:
        return <Feather name="chevron-down" size={12} color={employeeColors.textSecondary} />;
    }
  };

  const getStatusIndicatorColor = (status: string) => {
    switch (status) {
      case "Completed":
        return employeeColors.success || "#10B981";
      case "In Progress":
        return employeeColors.info || "#3B82F6";
      case "Todo":
      default:
        return employeeColors.textSecondary || "#94A3B8";
    }
  };

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
      <TouchableOpacity onPress={() => openDetails(item)} activeOpacity={0.9}>
        <Card
          style={{
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: employeeColors.border,
            ...shadows.sm,
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
              <Badge label={item.task_code} color={employeeColors.primary} variant="subtle" />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${employeeColors.border}40`, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm }}>
                {getPriorityIcon(item.priority)}
                <AppText variant="caption" weight="600" color={employeeColors.textSecondary}>
                  {item.priority}
                </AppText>
              </View>
            </View>
            <Badge
              label={item.status}
              color={
                isCompleted
                  ? employeeColors.success
                  : isInProgress
                  ? employeeColors.info
                  : employeeColors.warning
              }
            />
          </View>

          <AppText weight="700" variant="h3" color={employeeColors.text}>
            {item.title}
          </AppText>

          {item.project && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="briefcase" size={11} color={employeeColors.textSecondary} />
              <AppText variant="caption" color={employeeColors.textSecondary}>
                {item.project.project_name} ({item.project.project_code})
              </AppText>
            </View>
          )}

          {item.description ? (
            <AppText variant="body" color={employeeColors.textSecondary} numberOfLines={2}>
              {item.description}
            </AppText>
          ) : null}

          {/* Date Details */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: `${employeeColors.border}50`, paddingTop: spacing.sm, marginTop: 4 }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Feather name="calendar" size={11} color={employeeColors.textSecondary} />
                <AppText variant="caption" color={employeeColors.textSecondary}>
                  Due: {item.due_date || "--"}
                </AppText>
              </View>
              {item.created_at && (
                <AppText variant="caption" color={employeeColors.textSecondary}>
                  Assigned: {new Date(item.created_at).toISOString().split("T")[0]}
                </AppText>
              )}
            </View>
          </View>

          {/* Status Actions */}
          {!isCompleted ? (
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
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
                  <AppText variant="caption" weight="700" color={employeeColors.primary}>
                    {isUpdating ? "Completing..." : "Mark Complete"}
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs }}>
              <Feather name="check-circle" size={13} color={employeeColors.success} />
              <AppText variant="caption" weight="700" color={employeeColors.success}>
                Completed {item.completed_at ? `on: ${new Date(item.completed_at).toLocaleDateString()}` : ""}
              </AppText>
            </View>
          )}
        </Card>
      </TouchableOpacity>
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
          <View style={{ width: 80, height: 16, backgroundColor: `${employeeColors.border}60`, borderRadius: radius.sm }} />
          <View style={{ width: 60, height: 16, backgroundColor: `${employeeColors.border}60`, borderRadius: radius.sm }} />
        </View>
        <View style={{ width: "80%", height: 20, backgroundColor: `${employeeColors.border}60`, borderRadius: radius.sm }} />
        <View style={{ width: "100%", height: 14, backgroundColor: `${employeeColors.border}60`, borderRadius: radius.sm }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: 120, height: 12, backgroundColor: `${employeeColors.border}60`, borderRadius: radius.sm }} />
          <View style={{ width: 40, height: 12, backgroundColor: `${employeeColors.border}60`, borderRadius: radius.sm }} />
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <Screen isLoading={false} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="My Tasks" subtitle="Tasks assigned to you" />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, description, project code..."
        />

        {/* Filter Pills */}
        <View style={{ height: 36 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.xl }}>
            {[
              { id: "ALL", label: "All" },
              { id: "PENDING", label: "Pending" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "COMPLETED", label: "Completed" },
              { id: "OVERDUE", label: "Overdue" },
              { id: "HIGH_PRIORITY", label: "High Priority" },
              { id: "TODAY", label: "Today" },
              { id: "THIS_WEEK", label: "This Week" },
            ].map((filter) => {
              const isSelected = statusFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setStatusFilter(filter.id)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: isSelected ? employeeColors.primary : `${employeeColors.primary}10`,
                    justifyContent: "center",
                  }}
                >
                  <AppText variant="caption" weight="600" color={isSelected ? "#FFFFFF" : employeeColors.primary}>
                    {filter.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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

        {/* Task Details Sheet Modal */}

        <Modal visible={detailModalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "85%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
                <AppText variant="h2" weight="700">
                  Task Details
                </AppText>
                <TouchableOpacity onPress={() => { setDetailModalVisible(false); setSelectedTask(null); }}>
                  <Feather name="x" size={24} color={employeeColors.text} />
                </TouchableOpacity>
              </View>

              {selectedTask && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg }}>
                  <View style={{ gap: spacing.xs }}>
                    <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge label={selectedTask.task_code} color={employeeColors.primary} variant="subtle" />
                      <Badge label={selectedTask.status} color={selectedTask.status === "Completed" ? employeeColors.success : selectedTask.status === "In Progress" ? employeeColors.info : employeeColors.warning} />
                      <Badge label={`${selectedTask.priority} Priority`} color={selectedTask.priority === "High" || selectedTask.priority === "Urgent" ? employeeColors.danger : employeeColors.textSecondary} variant="subtle" />
                    </View>
                    <AppText variant="h2" weight="700" color={employeeColors.text} style={{ marginTop: spacing.xs }}>
                      {selectedTask.title}
                    </AppText>
                  </View>

                  {/* Project Summary */}
                  {selectedTask.project && (
                    <View style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
                      <AppText variant="caption" weight="600" color={employeeColors.textSecondary}>PROJECT</AppText>
                      <AppText weight="700">{selectedTask.project.project_name}</AppText>
                      <AppText variant="caption" color={employeeColors.textSecondary}>Code: {selectedTask.project.project_code}</AppText>
                    </View>
                  )}

                  {/* Task Details Stack */}
                  
                  <Card style={{ borderWidth: 1, borderColor: employeeColors.border, gap: spacing.md }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: `${employeeColors.border}50`, paddingBottom: spacing.sm }}>
                      <View>
                        <AppText variant="caption" color={employeeColors.textSecondary}>Assigned Date</AppText>
                        <AppText weight="600" style={{ marginTop: 2 }}>
                          {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : "--"}
                        </AppText>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <AppText variant="caption" color={employeeColors.textSecondary}>Due Date</AppText>
                        <AppText weight="600" color={employeeColors.danger} style={{ marginTop: 2 }}>
                          {selectedTask.due_date || "--"}
                        </AppText>
                      </View>
                    </View>

                    {/* Conditional Fields based on schema presence */}
                    <View style={{ gap: spacing.sm }}>
                      {/* Completion Time */}
                      {selectedTask.completed_at !== null && selectedTask.completed_at !== undefined && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <AppText variant="body" color={employeeColors.textSecondary}>Completed At</AppText>
                          <AppText weight="600" color={employeeColors.success}>
                            {new Date(selectedTask.completed_at).toLocaleString()}
                          </AppText>
                        </View>
                      )}

                      {/* Created By / Assigned By (conditional) */}
                      {selectedTask.created_by && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <AppText variant="body" color={employeeColors.textSecondary}>Assigned By</AppText>
                          <AppText variant="caption" weight="600" color={employeeColors.textSecondary}>
                            {selectedTask.member?.profile?.full_name ? "Administrator" : "Manager"}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </Card>

                  {/* Description / Notes (conditional) */}
                  {selectedTask.description ? (
                    <View style={{ gap: spacing.xs }}>
                      <AppText variant="caption" weight="600" color={employeeColors.textSecondary}>NOTES & DESCRIPTION</AppText>
                      <Card style={{ borderWidth: 1, borderColor: employeeColors.border }}>
                        <AppText variant="body" color={employeeColors.text} style={{ lineHeight: 22 }}>
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
                          onPress={() => handleStatusChange(selectedTask.id, "In Progress")}
                          loading={updatingTaskId === selectedTask.id}
                        />
                      ) : selectedTask.status === "In Progress" ? (
                        <Button
                          title="Mark Task Completed"
                          onPress={() => handleStatusChange(selectedTask.id, "Completed")}
                          loading={updatingTaskId === selectedTask.id}
                        />
                      ) : null}
                    </View>
                  ) : (
                    <View style={{ backgroundColor: `${employeeColors.success}10`, alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.md, borderRadius: 10 }}>
                      <AppText weight="700" color={employeeColors.success}>
                        ✔ Completed {selectedTask.completed_at ? `on: ${new Date(selectedTask.completed_at).toLocaleDateString()}` : ""}
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
    </Screen>
  );
}
