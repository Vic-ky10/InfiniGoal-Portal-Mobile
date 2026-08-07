import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { TaskWithProject } from "../task.types";
import { getTasks, updateTaskStatus } from "../task.service";

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("realtime-tasks-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  /**
   * Optimistic status update — immediately reflects in UI,
   * then persists via service. If the service fails the list
   * is re-fetched to restore the real state.
   */
  const handleUpdateStatus = useCallback(
    async (taskId: string, status: string, actualHours?: number) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                ...(status === "Completed"
                  ? { completed_at: new Date().toISOString() }
                  : {}),
                ...(actualHours !== undefined ? { actual_hours: actualHours } : {}),
              }
            : t
        )
      );

      const result = await updateTaskStatus(taskId, status, actualHours);

      if (!result.success) {
        // Revert on failure
        fetchTasks(false);
      }

      return result;
    },
    [fetchTasks]
  );

  return {
    tasks,
    loading,
    refreshing,
    refresh: () => fetchTasks(true),
    handleUpdateStatus,
  };
}
