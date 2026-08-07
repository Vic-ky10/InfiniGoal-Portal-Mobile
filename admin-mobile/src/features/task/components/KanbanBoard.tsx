/**
 * KanbanBoard.tsx — Mobile Kanban Board
 *
 * Ports the web KanbanBoard.tsx logic exactly to React Native.
 * Uses existing:
 *  - react-native-gesture-handler (LongPressGestureHandler + PanGestureHandler)
 *  - react-native-reanimated (animated ghost card)
 *  - task.service.ts (updateTaskStatus, deleteTask)
 *  - task.types.ts (TASK_STATUS, TASK_PRIORITY, TaskWithProject)
 *
 * Layout: horizontal ScrollView with 3 column lanes (same status set as web).
 * DnD: long-press activates a floating ghost card; drag to another column and release.
 * All permission rules match the web implementation exactly.
 */

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { AppText, Card } from "@/components/ui";
import { useThemeColors, adminColors, radius, spacing, shadows } from "@/theme";
import { toast } from "@/store/toast.store";

import { TaskWithProject, TASK_STATUS, TASK_PRIORITY } from "../task.types";
import { deleteTask } from "../task.service";
import TaskModal from "./TaskModal";

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const COLUMN_GAP = spacing.md;

const COLUMNS = [
  {
    id: TASK_STATUS.TODO,
    title: "Todo",
    emoji: "📋",
    color: "#F1F5F9",
    borderColor: "#CBD5E1",
    accentColor: "#64748B",
  },
  {
    id: TASK_STATUS.IN_PROGRESS,
    title: "In Progress",
    emoji: "🔄",
    color: "#EFF6FF",
    borderColor: "#BFDBFE",
    accentColor: "#2563EB",
  },
  {
    id: TASK_STATUS.COMPLETED,
    title: "Completed",
    emoji: "✅",
    color: "#F0FDF4",
    borderColor: "#BBF7D0",
    accentColor: "#16A34A",
  },
] as const;

type QuickFilter = "All" | "Mine" | "High" | "Overdue" | "Completed";

// ─── Props ────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  tasks: TaskWithProject[];
  isAdmin: boolean;
  profileId?: string | null;
  onStatusChange: (
    taskId: string,
    newStatus: string,
    actualHours?: number
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  onTaskDeleted?: () => void;
  onTaskSaved?: () => void;
  onCardPress?: (task: TaskWithProject) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTaskOverdue(task: TaskWithProject): boolean {
  if (task.status === TASK_STATUS.COMPLETED || !task.due_date) return false;
  return new Date(task.due_date) < new Date();
}

function getPriorityColor(priority: string, danger: string, warning: string, success: string, secondary: string) {
  switch (priority) {
    case TASK_PRIORITY.URGENT: return danger;
    case TASK_PRIORITY.HIGH:   return "#F97316";
    case TASK_PRIORITY.MEDIUM: return warning;
    case TASK_PRIORITY.LOW:    return success;
    default:                   return secondary;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case TASK_PRIORITY.URGENT: return "🔴";
    case TASK_PRIORITY.HIGH:   return "🟠";
    case TASK_PRIORITY.MEDIUM: return "🟡";
    default:                   return "🟢";
  }
}

function getProgressPct(status: string): number {
  if (status === TASK_STATUS.COMPLETED)  return 100;
  if (status === TASK_STATUS.IN_PROGRESS) return 50;
  return 0;
}

// ─── Draggable Task Card ──────────────────────────────────────────────────────

interface DraggableCardProps {
  task: TaskWithProject;
  isAdmin: boolean;
  profileId?: string | null;
  onPress: () => void;
  onDropToColumn: (taskId: string, absX: number) => void;
}

function DraggableCard({
  task,
  isAdmin,
  profileId,
  onPress,
  onDropToColumn,
}: DraggableCardProps) {
  const colors = useThemeColors();
  const isOverdue = isTaskOverdue(task);
  const progress = getProgressPct(task.status);
  const assigneeName = task.member?.profile?.full_name ?? "Unassigned";

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale     = useSharedValue(1);
  const opacity   = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const canDrag = useCallback(() => {
    if (isAdmin) return true;
    if (
      task.project?.status === "Completed" ||
      task.project?.status === "Cancelled"
    ) return false;
    if (!profileId || task.member?.profile_id !== profileId) return false;
    return true;
  }, [isAdmin, task, profileId]);

  const handleDropJS = useCallback(
    (absX: number) => {
      onDropToColumn(task.id, absX);
    },
    [task.id, onDropToColumn]
  );

  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .runOnJS(true)
    .onStart(() => {
      if (!canDrag()) return;
      isDragging.value = true;
      scale.value = withSpring(1.05);
      opacity.value = withTiming(0.9);
    });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(handleDropJS)(e.absoluteX);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      isDragging.value = false;
    })
    .onFinalize(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      isDragging.value = false;
    });

  const composed = Gesture.Simultaneous(longPressGesture, panGesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isDragging.value ? 999 : 1,
    elevation: isDragging.value ? 20 : 2,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animStyle, { marginBottom: spacing.sm }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: isOverdue ? "#EF4444" : colors.border,
              borderLeftWidth: isOverdue ? 3 : 1,
              borderLeftColor: isOverdue ? "#EF4444" : colors.border,
            },
          ]}
        >
          {/* Header: code + priority */}
          <View style={styles.cardHeader}>
            <AppText
              variant="caption"
              weight="700"
              color={colors.textSecondary}
              style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}
            >
              {task.task_code}
            </AppText>
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(task.priority, "#EF4444", "#F59E0B", "#22C55E", "#64748B")}15` }]}>
              <AppText variant="caption" weight="700">
                {getPriorityIcon(task.priority)} {task.priority}
              </AppText>
            </View>
          </View>

          {/* Title */}
          <AppText
            weight="700"
            color={colors.text}
            numberOfLines={2}
            style={{ marginTop: spacing.xs, lineHeight: 18, fontSize: 13 }}
          >
            {task.title}
          </AppText>

          {/* Description snippet */}
          {task.description ? (
            <AppText
              variant="caption"
              color={colors.textSecondary}
              numberOfLines={1}
              style={{ marginTop: 2, lineHeight: 16 }}
            >
              {task.description}
            </AppText>
          ) : null}

          {/* Progress bar */}
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.progressHeader}>
              <AppText variant="caption" color={colors.textSecondary}>Progress</AppText>
              <AppText variant="caption" weight="700" color={colors.textSecondary}>{progress}%</AppText>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%` as any,
                    backgroundColor:
                      task.status === TASK_STATUS.COMPLETED
                        ? "#22C55E"
                        : task.status === TASK_STATUS.IN_PROGRESS
                        ? "#2563EB"
                        : "#CBD5E1",
                  },
                ]}
              />
            </View>
          </View>

          {/* Assignee */}
          <View style={[styles.assigneePill, { backgroundColor: colors.surface }]}>
            <AppText variant="caption">👤</AppText>
            <AppText variant="caption" weight="600" color={colors.text} numberOfLines={1}>
              {assigneeName}
            </AppText>
          </View>

          {/* Footer: due date + hours */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <Feather
                name="calendar"
                size={11}
                color={isOverdue ? "#EF4444" : colors.textSecondary}
              />
              <AppText
                variant="caption"
                color={isOverdue ? "#EF4444" : colors.textSecondary}
                weight={isOverdue ? "700" : "400"}
              >
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "No due date"}
              </AppText>
            </View>
            {task.estimated_hours ? (
              <View style={styles.hoursChip}>
                <Feather name="clock" size={10} color={colors.textSecondary} />
                <AppText variant="caption" weight="700" color={colors.textSecondary}>
                  {task.status === TASK_STATUS.COMPLETED
                    ? `${task.actual_hours ?? task.estimated_hours}h`
                    : `${task.estimated_hours}h`}
                </AppText>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Column Component ─────────────────────────────────────────────────────────

interface ColumnProps {
  col: (typeof COLUMNS)[number];
  tasks: TaskWithProject[];
  isOver: boolean;
  isAdmin: boolean;
  profileId?: string | null;
  onCardPress: (task: TaskWithProject) => void;
  onDropToColumn: (taskId: string, absX: number) => void;
  onDeleteTask?: (task: TaskWithProject) => void;
  onAddTask?: () => void;
  onColumnLayout: (colId: string, x: number, width: number) => void;
}

function Column({
  col,
  tasks,
  isOver,
  isAdmin,
  profileId,
  onCardPress,
  onDropToColumn,
  onDeleteTask,
  onAddTask,
  onColumnLayout,
}: ColumnProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.column,
        {
          backgroundColor: isOver ? `${col.accentColor}08` : col.color,
          borderColor: isOver ? col.accentColor : col.borderColor,
          borderWidth: isOver ? 2 : 1,
          width: COLUMN_WIDTH,
        },
      ]}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        onColumnLayout(col.id, x, width);
      }}
    >
      {/* Column header */}
      <View style={styles.columnHeader}>
        <View style={styles.columnTitleRow}>
          <AppText style={{ fontSize: 15 }}>{col.emoji}</AppText>
          <AppText weight="700" color={col.accentColor} style={{ fontSize: 13 }}>
            {col.title}
          </AppText>
          <View style={[styles.countBadge, { backgroundColor: `${col.accentColor}20` }]}>
            <AppText variant="caption" weight="700" color={col.accentColor}>
              {tasks.length}
            </AppText>
          </View>
        </View>
        {isAdmin && onAddTask && (
          <TouchableOpacity onPress={onAddTask} style={styles.addBtn}>
            <Feather name="plus" size={14} color={col.accentColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cards */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.xl,
          flexGrow: tasks.length === 0 ? 1 : undefined,
          justifyContent: tasks.length === 0 ? "center" : undefined,
        }}
        nestedScrollEnabled
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyColumn}>
            <AppText style={{ fontSize: 24, marginBottom: spacing.xs }}>🎉</AppText>
            <AppText
              variant="caption"
              weight="700"
              color={colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              No tasks here
            </AppText>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              style={{ textAlign: "center", marginTop: 2 }}
            >
              Drag tasks here or create one
            </AppText>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id}>
              <DraggableCard
                task={task}
                isAdmin={isAdmin}
                profileId={profileId}
                onPress={() => onCardPress(task)}
                onDropToColumn={onDropToColumn}
              />
              {/* Admin-only delete button on completed tasks */}
              {isAdmin && task.status === TASK_STATUS.COMPLETED && onDeleteTask && (
                <TouchableOpacity
                  onPress={() => onDeleteTask(task)}
                  style={[styles.deleteBtn, { marginBottom: spacing.sm }]}
                >
                  <Feather name="trash-2" size={11} color="#EF4444" />
                  <AppText variant="caption" weight="700" color="#EF4444">
                    Delete
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}


// ─── Main KanbanBoard ─────────────────────────────────────────────────────────

export default function KanbanBoard({
  tasks,
  isAdmin,
  profileId,
  onStatusChange,
  onTaskDeleted,
  onTaskSaved,
  onCardPress,
}: KanbanBoardProps) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("All");
  const [hoveredColumn] = useState<string | null>(null);

  // Completion confirm state (same as web)
  const [completionConfirm, setCompletionConfirm] = useState<{
    task: TaskWithProject;
    targetStatus: string;
  } | null>(null);
  const [actualHoursInput, setActualHoursInput] = useState<string>("0");

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<TaskWithProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create task modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Column layout tracking for DnD hit detection
  const columnPositions = useRef<Record<string, { x: number; width: number }>>({});
  const scrollOffsetRef = useRef<number>(0);

  const handleColumnLayout = useCallback(
    (colId: string, x: number, width: number) => {
      columnPositions.current[colId] = { x, width };
    },
    []
  );

  // ── Quick filter logic (mirrors web exactly) ──────────────────────────────
  const filteredTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter((task) => {
      if (quickFilter === "Mine") {
        if (!profileId || task.member?.profile_id !== profileId) return false;
      } else if (quickFilter === "High") {
        if (
          task.priority !== TASK_PRIORITY.HIGH &&
          task.priority !== TASK_PRIORITY.URGENT
        )
          return false;
      } else if (quickFilter === "Overdue") {
        if (task.status === TASK_STATUS.COMPLETED || !task.due_date) return false;
        if (new Date(task.due_date) >= today) return false;
      } else if (quickFilter === "Completed") {
        if (task.status !== TASK_STATUS.COMPLETED) return false;
      }
      return true;
    });
  }, [tasks, quickFilter, profileId]);

  // ── Status change executor (declared first so it can be referenced below) ──
  const executeStatusChange = async (
    taskId: string,
    status: string,
    hours?: number
  ) => {
    const response = await onStatusChange(taskId, status, hours);
    if (response.success) {
      toast.success(response.message ?? `Task moved to ${status}`);
    } else {
      toast.error(response.error ?? "Failed to update task status");
    }
  };

  // ── Drop handler — mirrors web exactly ───────────────────────────────────
  const handleDropToColumn = useCallback(
    async (taskId: string, absX: number) => {
      const scrollOffset = scrollOffsetRef.current;
      const adjustedX = absX + scrollOffset;
      let targetStatus: string | null = null;
      for (const [colId, pos] of Object.entries(columnPositions.current)) {
        if (adjustedX >= pos.x && adjustedX <= pos.x + pos.width) {
          targetStatus = colId;
          break;
        }
      }

      if (!targetStatus) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (task.status === targetStatus) return;

      // ── Employee permission checks (identical to web) ──────────────────
      if (!isAdmin) {
        if (
          task.project?.status === "Completed" ||
          task.project?.status === "Cancelled"
        ) {
          toast.error("This project is completed/cancelled. Tasks are read-only.");
          return;
        }
        if (!profileId || task.member?.profile_id !== profileId) {
          toast.error("You can only drag tasks assigned to you.");
          return;
        }
        if (
          task.status === TASK_STATUS.TODO &&
          targetStatus === TASK_STATUS.COMPLETED
        ) {
          toast.error("Please move tasks to 'In Progress' first.");
          return;
        }
        if (
          task.status === TASK_STATUS.IN_PROGRESS &&
          targetStatus === TASK_STATUS.TODO
        ) {
          toast.error("Moving tasks back to 'Todo' is not allowed.");
          return;
        }
        if (task.status === TASK_STATUS.COMPLETED) {
          toast.error("Completed tasks cannot be reopened.");
          return;
        }
      }

      // ── Completion confirmation (same as web) ─────────────────────────
      if (targetStatus === TASK_STATUS.COMPLETED) {
        setActualHoursInput(String(task.actual_hours ?? task.estimated_hours ?? 0));
        setCompletionConfirm({ task, targetStatus });
        return;
      }

      await executeStatusChange(taskId, targetStatus);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, isAdmin, profileId, onStatusChange]
  );


  const handleConfirmCompletion = async () => {
    if (!completionConfirm) return;
    const { task, targetStatus } = completionConfirm;
    setCompletionConfirm(null);
    await executeStatusChange(
      task.id,
      targetStatus,
      parseFloat(actualHoursInput) || 0
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await deleteTask(deleteConfirm.id);
      if (res.success) {
        toast.success(res.message ?? "Task deleted successfully.");
        onTaskDeleted?.();
      } else {
        toast.error(res.error ?? "Failed to delete task.");
      }
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  // ── Quick filter tabs ────────────────────────────────────────────────────
  const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
    { id: "All", label: "All" },
    { id: "Mine", label: "My Tasks" },
    { id: "High", label: "High Priority" },
    { id: "Overdue", label: "Overdue" },
    { id: "Completed", label: "Completed" },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* ── Quick Filters ─────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.filterRow}
        >
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setQuickFilter(f.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? adminColors.primary : adminColors.surface,
                    borderColor: active ? adminColors.primary : adminColors.border,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="700"
                  color={active ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {f.label}
                </AppText>
              </TouchableOpacity>
            );
          })}

          {isAdmin && (
            <TouchableOpacity
              onPress={() => setIsCreateOpen(true)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: adminColors.primary,
                  borderColor: adminColors.primary,
                  flexDirection: "row",
                  gap: 4,
                },
              ]}
            >
              <Feather name="plus" size={13} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                Add Task
              </AppText>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ── Kanban Columns ────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.columnsContainer, { flexGrow: 1 }]}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollOffsetRef.current = e.nativeEvent.contentOffset.x;
          }}
        >
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = hoveredColumn === col.id;
            return (
              <Column
                key={col.id}
                col={col}
                tasks={colTasks}
                isOver={isOver}
                isAdmin={isAdmin}
                profileId={profileId}
                onCardPress={(task) => {
                  if (onCardPress) {
                    onCardPress(task);
                  }
                }}
                onDropToColumn={handleDropToColumn}
                onDeleteTask={isAdmin ? setDeleteConfirm : undefined}
                onAddTask={isAdmin ? () => setIsCreateOpen(true) : undefined}
                onColumnLayout={handleColumnLayout}
              />
            );
          })}
        </ScrollView>

        {/* ── Completion Confirmation Modal ─────────────────────────────── */}
        <Modal
          visible={!!completionConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setCompletionConfirm(null)}
        >
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              {/* Icon */}
              <View style={[styles.modalIcon, { backgroundColor: "#F0FDF4" }]}>
                <Feather name="check-circle" size={24} color="#16A34A" />
              </View>

              <AppText
                variant="h2"
                weight="700"
                style={{ textAlign: "center", marginBottom: spacing.xs }}
              >
                Complete Task?
              </AppText>
              <AppText
                variant="body"
                color={adminColors.textSecondary}
                style={{ textAlign: "center", marginBottom: spacing.lg }}
              >
                Marking{" "}
                <AppText weight="700" color={adminColors.text}>
                  {'"'}{completionConfirm?.task.title}{'"'}
                </AppText>{" "}
                as finished.
              </AppText>

              {/* Actual hours input */}
              <View
                style={[
                  styles.hoursInputContainer,
                  { backgroundColor: adminColors.surface, borderColor: adminColors.border },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="700"
                  color={adminColors.textSecondary}
                  style={{ marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Log Actual Hours Worked
                </AppText>
                <TextInput
                  value={actualHoursInput}
                  onChangeText={setActualHoursInput}
                  keyboardType="decimal-pad"
                  style={[
                    styles.hoursInput,
                    { backgroundColor: "#FFFFFF", borderColor: adminColors.border, color: adminColors.text },
                  ]}
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setCompletionConfirm(null)}
                  style={[styles.modalBtn, { backgroundColor: adminColors.surface, borderColor: adminColors.border, borderWidth: 1 }]}
                >
                  <AppText weight="600" color={adminColors.textSecondary}>
                    Cancel
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmCompletion}
                  style={[styles.modalBtn, { backgroundColor: "#16A34A" }]}
                >
                  <Feather name="check-circle" size={14} color="#FFFFFF" />
                  <AppText weight="700" color="#FFFFFF">
                    Complete Task
                  </AppText>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </Modal>

        {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
        <Modal
          visible={!!deleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteConfirm(null)}
        >
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={[styles.modalIcon, { backgroundColor: "#FEF2F2" }]}>
                <Feather name="alert-circle" size={24} color="#EF4444" />
              </View>

              <AppText
                variant="h2"
                weight="700"
                style={{ textAlign: "center", marginBottom: spacing.xs }}
              >
                Delete Task?
              </AppText>
              <AppText
                variant="body"
                color={adminColors.textSecondary}
                style={{ textAlign: "center", marginBottom: spacing.lg }}
              >
                This action cannot be undone.
              </AppText>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  style={[styles.modalBtn, { backgroundColor: adminColors.surface, borderColor: adminColors.border, borderWidth: 1 }]}
                >
                  <AppText weight="600" color={adminColors.textSecondary}>
                    Cancel
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmDelete}
                  disabled={deleting}
                  style={[styles.modalBtn, { backgroundColor: "#EF4444", opacity: deleting ? 0.6 : 1 }]}
                >
                  <AppText weight="700" color="#FFFFFF">
                    {deleting ? "Deleting..." : "Delete"}
                  </AppText>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </Modal>

        {/* ── Create/Edit Task Modal ─────────────────────────────────────── */}
        <TaskModal
          visible={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            onTaskSaved?.();
          }}
          taskToEdit={null}
        />
      </View>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs, // Reduced vertical padding from sm (8) to xs (4)
    alignItems: "center",
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  columnsContainer: {
    flexDirection: "row",
    gap: COLUMN_GAP,
    paddingHorizontal: spacing.sm, // Reduced horizontal padding from md (12) to sm (8)
    paddingBottom: spacing.md, // Reduced bottom spacing from xl (20) to md (12)
    alignItems: "stretch", // Stretches columns to full vertical height of scrollview
  },
  column: {
    borderRadius: radius.lg, // Cleaner radius for tighter layout
    padding: spacing.sm, // Reduced internal column padding from md (12) to sm (8)
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm, // Reduced header margin from md (12) to sm (8)
  },
  columnTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  addBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  emptyColumn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: radius.lg,
    backgroundColor: "#FFFFFF50",
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radius.md, // Clean border radius
    padding: spacing.sm, // Reduced card padding from md (12) to sm (8) to save vertical space
    borderWidth: 1,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  assigneePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  hoursChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    ...shadows.lg,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  hoursInputContainer: {
    width: "100%",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  hoursInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
});
