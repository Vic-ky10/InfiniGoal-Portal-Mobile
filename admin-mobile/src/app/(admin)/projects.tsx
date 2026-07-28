import { useMemo, useState } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useProjects } from "@/features/project/hooks/useProjects";
import ProjectCard from "@/features/project/components/ProjectCard";
import ProjectModal from "@/features/project/components/ProjectModal";
import ProjectAssignModal from "@/features/project/components/ProjectAssignModal";
import { ProjectStatus, ProjectWithMembers } from "@/features/project/project.types";
import { deleteProject } from "@/features/project/project.service";

const STATUS_FILTERS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "Active" },
  { label: "Completed", value: "Completed" },
  { label: "Archived", value: "Archived" },
];

export default function ProjectsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");

  // Modals
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);

  const { projects, stats, loading, refreshing, refresh } = useProjects();

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

    return matchesSearch && matchesStatus;
  });
}, [projects, searchQuery, statusFilter]);

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
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete ${project.project_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteProject(project.id);
            if (res.success) {
              Alert.alert("Success", res.message);
              refresh();
            } else {
              Alert.alert("Error", res.error || "Failed to delete project.");
            }
          },
        },
      ]
    );
  };

  const handleProjectCardPress = (project: ProjectWithMembers) => {
    Alert.alert(
      project.project_name,
      `Code: ${project.project_code}\nPriority: ${project.priority}\nStatus: ${project.status}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "View Team / Assign",
          onPress: () => handleAssign(project),
        },
        {
          text: "Edit Project",
          onPress: () => handleEdit(project),
        },
        {
          text: "Delete Project",
          style: "destructive",
          onPress: () => handleDelete(project),
        },
      ]
    );
  };

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
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

        {/* Dashboard Stats */}
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>Total</AppText>
            <AppText weight="700" variant="h3" color={adminColors.primary}>
              {stats.totalProjects}
            </AppText>
          </Card>

          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>Active</AppText>
            <AppText weight="700" variant="h3" color={adminColors.info}>
              {stats.activeProjects}
            </AppText>
          </Card>

          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>Done</AppText>
            <AppText weight="700" variant="h3" color={adminColors.success}>
              {stats.completedProjects}
            </AppText>
          </Card>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filters */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
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
        </View>

        {/* Projects List */}
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredProjects.length === 0 ? 1 : undefined,
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
    </Screen>
  );
}