import { useState, useEffect, useCallback } from "react";
import { View, FlatList } from "react-native";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { EmployeeProject } from "@/features/project/project.types";
import { getEmployeeProjects } from "@/features/project/project.service";

export default function EmployeeProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<EmployeeProject[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
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
    loadData();
  }, [loadData]);

  const renderProjectItem = ({ item }: { item: EmployeeProject }) => {
    const proj = item.project;
    if (!proj) return null;

    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Badge label={proj.project_code} color={employeeColors.primary} variant="subtle" />
              <Badge
                label={proj.status}
                color={
                  proj.status === "Active"
                    ? employeeColors.primary
                    : proj.status === "Completed"
                    ? employeeColors.info
                    : employeeColors.warning
                }
              />
            </View>

            <AppText weight="700" variant="h3" style={{ marginTop: spacing.xs }}>
              {proj.project_name}
            </AppText>

            <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: spacing.xs }}>
              Role: {item.member_role} | Joined: {item.joined_date ?? item.assigned_at?.split("T")[0] ?? "--"}
            </AppText>

            {proj.description && (
              <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.sm }}>
                {proj.description}
              </AppText>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
              <AppText variant="caption" color={employeeColors.textSecondary}>
                Priority: {proj.priority}
              </AppText>
              <AppText variant="caption" color={employeeColors.textSecondary}>
                Progress: {proj.progress ?? 0}%
              </AppText>
            </View>
          </View>
        </View>
      </Card>
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
