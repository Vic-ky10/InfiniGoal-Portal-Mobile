import { useCallback, useEffect, useState } from "react";
import {
  ProjectDashboardStats,
  ProjectFilters,
  ProjectWithMembers,
} from "../project.types";
import {
  getProjectDashboardStats,
  getProjects,
} from "../project.service";

export function useProjects(initialFilters: ProjectFilters = {}) {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [stats, setStats] = useState<ProjectDashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    archivedProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters);

  const fetchProjects = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [data, statsData] = await Promise.all([
        getProjects(filters),
        getProjectDashboardStats(),
      ]);

      setProjects(data);
      setStats(statsData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    stats,
    loading,
    refreshing,
    filters,
    setFilters,
    refresh: () => fetchProjects(true),
  };
}
