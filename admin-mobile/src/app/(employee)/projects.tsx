import { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import {
  EmployeeProject,
  ProjectWithMembers,
  ProjectFilters,
} from "@/features/project/project.types";
import { getEmployeeProjects } from "@/features/project/project.service";
import ProjectCard from "@/features/project/components/ProjectCard";
import ProjectFilterBar from "@/features/project/components/ProjectFilterBar";

export default function EmployeeProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<EmployeeProject[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getEmployeeProjects(user.id);
      setProjects(data);
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

   
    const channel = supabase
      .channel("realtime-projects-employee")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredProjects = useMemo(() => {
    const search = (filters.search || "").trim().toLowerCase();
    return projects.filter((item) => {
      const proj = item.project;
      if (!proj) return false;

      const matchesSearch =
        search === "" ||
        proj.project_name?.toLowerCase().includes(search) ||
        proj.project_code?.toLowerCase().includes(search) ||
        proj.description?.toLowerCase().includes(search);

      const matchesStatus =
        !filters.status || proj.status === filters.status;

      const matchesPriority =
        !filters.priority || proj.priority === filters.priority;

      const matchesDate =
        !filters.date || proj.created_at?.startsWith(filters.date);

      const matchesMonth =
        !filters.month || proj.created_at?.startsWith(filters.month);

      const matchesYear =
        !filters.year || proj.created_at?.startsWith(filters.year);

      return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesMonth && matchesYear;
    });
  }, [projects, filters]);

  const renderProjectItem = ({ item }: { item: EmployeeProject }) => {
    const proj = item.project;
    if (!proj) return null;

    const projectWithMembers: ProjectWithMembers = {
      ...proj,
      members: item.team ?? [],
    };

    return (
      <View style={{ marginBottom: spacing.md }}>
        <ProjectCard
          project={projectWithMembers}
          showRoleInfo={true}
          memberRole={item.member_role}
          assignedDate={item.joined_date ?? item.assigned_at}
        />
      </View>
    );
  };

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="My Projects"
          subtitle={`${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""} assigned to you`}
        />

        
        <ProjectFilterBar filters={filters} onFiltersChange={setFilters} />

        {/* projects List */}
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                title={
                  filters.search || filters.status || filters.priority
                    ? "No projects match your filter."
                    : "No Projects Assigned"
                }
              />
            }
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
