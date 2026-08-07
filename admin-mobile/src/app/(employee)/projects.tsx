import { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, ScrollView, TouchableOpacity } from "react-native";

import { Screen, AppText } from "@/components/ui";
import { AppHeader, EmptyState, SearchBar } from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import {
  EmployeeProject,
  ProjectStatus,
  ProjectWithMembers,
} from "@/features/project/project.types";
import { getEmployeeProjects } from "@/features/project/project.service";
import ProjectCard from "@/features/project/components/ProjectCard";

const STATUS_FILTERS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Planning", value: "Planning" },
  { label: "Active", value: "Active" },
  { label: "On Hold", value: "On Hold" },
  { label: "Completed", value: "Completed" },
];

export default function EmployeeProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<EmployeeProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");

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

    // Subscribe to realtime project updates
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
    const search = searchQuery.trim().toLowerCase();
    return projects.filter((item) => {
      const proj = item.project;
      if (!proj) return false;

      const matchesSearch =
        search === "" ||
        proj.project_name?.toLowerCase().includes(search) ||
        proj.project_code?.toLowerCase().includes(search) ||
        proj.description?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "" || proj.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

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

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search projects..."
        />

        {/* Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            flexDirection: "row",
            gap: spacing.xs,
            paddingRight: spacing.xl,
          }}
        >
          {STATUS_FILTERS.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setStatusFilter(opt.value)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected
                    ? employeeColors.primary
                    : `${employeeColors.primary}10`,
                  justifyContent: "center",
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : employeeColors.primary}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Projects List */}
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
                searchQuery || statusFilter
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
