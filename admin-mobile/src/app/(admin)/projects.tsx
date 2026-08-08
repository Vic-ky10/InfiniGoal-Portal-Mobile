/* eslint-disable react-hooks/set-state-in-effect */
import { useMemo, useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { AppText, Screen, Card } from "@/components/ui";
import {
  AppHeader,
  EmptyState,
  ActionSheet,
  ActionSheetOption,
} from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useProjects } from "@/features/project/hooks/useProjects";
import ProjectCard from "@/features/project/components/ProjectCard";
import ProjectModal from "@/features/project/components/ProjectModal";
import ProjectAssignModal from "@/features/project/components/ProjectAssignModal";
import ProjectFilterBar from "@/features/project/components/ProjectFilterBar";
import {
  ProjectWithMembers,
  ProjectFilters,
} from "@/features/project/project.types";
import { deleteProject } from "@/features/project/project.service";
import { toast } from "@/store/toast.store";

type SortKey = "newest" | "oldest" | "az" | "za" | "progress_desc" | "progress_asc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "A → Z", value: "az" },
  { label: "Z → A", value: "za" },
  { label: "Progress ↑", value: "progress_asc" },
  { label: "Progress ↓", value: "progress_desc" },
];

export default function ProjectsScreen() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  // Modals
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean;
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    options: [],
  });

  const { projects, stats, loading, refreshing, refresh } = useProjects();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();


  const filteredProjects = useMemo(() => {
    const search = (filters.search || "").trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        search === "" ||
        project.project_name?.toLowerCase().includes(search) ||
        project.project_code?.toLowerCase().includes(search) ||
        project.description?.toLowerCase().includes(search);

      const matchesStatus =
        !filters.status || project.status === filters.status;

      const matchesPriority =
        !filters.priority || project.priority === filters.priority;

      const matchesDate =
        !filters.date || project.created_at?.startsWith(filters.date);

      const matchesMonth =
        !filters.month || project.created_at?.startsWith(filters.month);

      const matchesYear =
        !filters.year || project.created_at?.startsWith(filters.year);

      return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesMonth && matchesYear;
    });
  }, [projects, filters]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "az":
          return a.project_name.localeCompare(b.project_name);
        case "za":
          return b.project_name.localeCompare(a.project_name);
        case "progress_desc":
          return (b.progress ?? 0) - (a.progress ?? 0);
        case "progress_asc":
          return (a.progress ?? 0) - (b.progress ?? 0);
        default:
          return 0;
      }
    });
  }, [filteredProjects, sortKey]);

  const handleCreateNew = () => {
    setSelectedProject(null);
    setProjectModalVisible(true);
  };

  const handleEdit = (project: ProjectWithMembers) => {
    setSelectedProject(project);
    setProjectModalVisible(true);
  };

  const handleAssign = (project: ProjectWithMembers) => {
    setSelectedProject(project);
    setAssignModalVisible(true);
  };

  const handleDelete = (project: ProjectWithMembers) => {
    setActionSheetConfig({
      visible: true,
      title: "Delete Project",
      subtitle: `Are you sure you want to delete ${project.project_name}?`,
      options: [
        {
          label: "Delete",
          isDestructive: true,
          icon: "🗑",
          onPress: async () => {
            const res = await deleteProject(project.id);
            if (res.success) {
              toast.success(res.message || "Project deleted successfully.");
              refresh();
            } else {
              toast.error(res.error || "Failed to delete project.");
            }
          },
        },
      ],
    });
  };

  const handleProjectCardPress = (project: ProjectWithMembers) => {
    setActionSheetConfig({
      visible: true,
      title: project.project_name,
      subtitle:
        `🏷 ${project.project_code}  🔥 ${project.priority}  🟢 ${project.status}  📊 ${project.progress ?? 0}%`,
      options: [
        {
          label: "View Team / Assign",
          icon: "👥",
          onPress: () => handleAssign(project),
        },
        {
          label: "Edit Project",
          icon: "✏️",
          onPress: () => handleEdit(project),
        },
        {
          label: "Delete Project",
          isDestructive: true,
          icon: "🗑",
          onPress: () => handleDelete(project),
        },
      ],
    });
  };

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        handleProjectCardPress(project);
      } else {
        toast.error("The requested project could not be found.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Newest First";

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        {/* Header */}
        <AppHeader
          title="Projects"
          subtitle="Organization projects & progress"
          rightComponent={
            <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setSortSheetVisible(true)}
                style={{
                  backgroundColor: adminColors.surface,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: adminColors.border,
                  height: 32,
                  justifyContent: "center",
                }}
              >
                <AppText variant="caption" weight="700" color={adminColors.textSecondary}>
                  Sort
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateNew}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: adminColors.primary,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.md,
                  gap: 4,
                  height: 32,
                  justifyContent: "center",
                }}
              >
                <Feather name="plus" size={14} color="#FFFFFF" />
                <AppText variant="caption" weight="700" color="#FFFFFF">
                  New
                </AppText>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Total
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.primary}>
              {stats.totalProjects}
            </AppText>
          </Card>
          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Active
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.info}>
              {stats.activeProjects}
            </AppText>
          </Card>
          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Done
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.success}>
              {stats.completedProjects}
            </AppText>
          </Card>
        </View>

        {/* Standardized Project Filter Bar */}
        <ProjectFilterBar filters={filters} onFiltersChange={setFilters} isAdmin />

        {/* Results count */}
        <AppText variant="caption" color={adminColors.textSecondary}>
          {sortedProjects.length} project{sortedProjects.length !== 1 ? "s" : ""} · {currentSortLabel}
        </AppText>

        {/* Projects List */}
        <FlatList
          data={sortedProjects}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: sortedProjects.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No projects found." />}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => handleProjectCardPress(item)}
            />
          )}
        />
      </View>

      <ProjectModal
        visible={projectModalVisible}
        onClose={() => setProjectModalVisible(false)}
        onSuccess={refresh}
        projectToEdit={selectedProject}
      />

      <ProjectAssignModal
        visible={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        onSuccess={refresh}
        project={selectedProject}
      />

      <ActionSheet
        visible={actionSheetConfig.visible}
        onClose={() =>
          setActionSheetConfig((prev) => ({ ...prev, visible: false }))
        }
        title={actionSheetConfig.title}
        subtitle={actionSheetConfig.subtitle}
        options={actionSheetConfig.options}
      />

      {/* Sort Action Sheet */}
      <ActionSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        title="Sort Projects"
        options={SORT_OPTIONS.map((opt) => ({
          label: opt.label,
          icon: sortKey === opt.value ? "+" : "*",
          onPress: () => {
            setSortKey(opt.value);
            setSortSheetVisible(false);
          },
        }))}
      />
    </Screen>
  );
}
