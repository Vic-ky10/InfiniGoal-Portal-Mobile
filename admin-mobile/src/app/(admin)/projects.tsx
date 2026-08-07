import { useMemo, useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { AppText, Screen, Card } from "@/components/ui";
import {
  AppHeader,
  SearchBar,
  EmptyState,
  ActionSheet,
  ActionSheetOption,
} from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useProjects } from "@/features/project/hooks/useProjects";
import ProjectCard from "@/features/project/components/ProjectCard";
import ProjectModal from "@/features/project/components/ProjectModal";
import ProjectAssignModal from "@/features/project/components/ProjectAssignModal";
import {
  ProjectPriority,
  ProjectStatus,
  ProjectWithMembers,
} from "@/features/project/project.types";
import { deleteProject } from "@/features/project/project.service";
import { toast } from "@/store/toast.store";

const STATUS_FILTERS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Planning", value: "Planning" },
  { label: "Active", value: "Active" },
  { label: "On Hold", value: "On Hold" },
  { label: "Completed", value: "Completed" },
  { label: "Archived", value: "Archived" },
];

const PRIORITY_FILTERS: { label: string; value: ProjectPriority | "" }[] = [
  { label: "All Priority", value: "" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "">("");
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

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        handleProjectCardPress(project);
      } else {
        toast.error("The requested project could not be found.");
      }
    }
  }, [projectId, projects]);

  const filteredProjects = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        search === "" ||
        project.project_name?.toLowerCase().includes(search) ||
        project.project_code?.toLowerCase().includes(search) ||
        project.description?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "" || project.status === statusFilter;

      const matchesPriority =
        priorityFilter === "" || project.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

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
              }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                New
              </AppText>
            </TouchableOpacity>
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

        {/* Search + Sort */}
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <TouchableOpacity
            onPress={() => setSortSheetVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: adminColors.border,
              backgroundColor: adminColors.surface,
            }}
          >
            <Feather name="sliders" size={13} color={adminColors.textSecondary} />
            <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
              Sort
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ flexDirection: "row", gap: spacing.xs, paddingRight: spacing.xl }}
        >
          {STATUS_FILTERS.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setStatusFilter(opt.value)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? adminColors.primary : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? adminColors.primary : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Priority Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ flexDirection: "row", gap: spacing.xs, paddingRight: spacing.xl }}
        >
          {PRIORITY_FILTERS.map((opt) => {
            const isSelected = priorityFilter === opt.value;
            const pillColor = opt.value === "High" ? "#EF4444" : opt.value === "Medium" ? "#F59E0B" : opt.value === "Low" ? "#22C55E" : adminColors.primary;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setPriorityFilter(opt.value)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? pillColor : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? pillColor : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
          icon: sortKey === opt.value ? "✓" : "  ",
          onPress: () => {
            setSortKey(opt.value);
            setSortSheetVisible(false);
          },
        }))}
      />
    </Screen>
  );
}
