import { useCallback, useEffect, useState } from "react";
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
  }, [fetchTasks]);

  const handleUpdateStatus = async (taskId: string, status: string) => {
    const result = await updateTaskStatus(taskId, status);
    if (result.success) {
      fetchTasks(true);
    }
    return result;
  };

  return {
    tasks,
    loading,
    refreshing,
    refresh: () => fetchTasks(true),
    handleUpdateStatus,
  };
}
