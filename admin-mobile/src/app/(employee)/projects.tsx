import { useState, useEffect, useCallback } from "react";
import { View, FlatList } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { EmployeeProject, ProjectWithMembers } from "@/features/project/project.types";
import { getEmployeeProjects } from "@/features/project/project.service";
import ProjectCard from "@/features/project/components/ProjectCard";

export default function EmployeeProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<EmployeeProject[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
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
  }, [loadData]);

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
        <AppHeader title="My Projects" subtitle="Projects you are assigned to" />

        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Projects Assigned" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
