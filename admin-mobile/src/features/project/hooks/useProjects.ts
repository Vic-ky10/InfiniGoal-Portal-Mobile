import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
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
  

  const fetchProjects = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [data, statsData] = await Promise.all([
        getProjects(),
        getProjectDashboardStats(),
      ]);

      setProjects(data);
      setStats(statsData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel("realtime-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          fetchProjects(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  return {
    projects,
    stats,
    loading,
    refreshing,
  
    refresh: () => fetchProjects(true),
  };
}
