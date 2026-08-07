import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Input, DatePickerField } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { TaskWithProject, TASK_PRIORITY, TASK_STATUS } from "../task.types";
import {
  createTask,
  updateTask,
  getAuthenticatedProfileId,
} from "../task.service";
import {
  getProjects,
  getProjectMembers,
} from "@/features/project/project.service";
import {
  ProjectWithMembers,
  ProjectMemberWithEmployee,
} from "@/features/project/project.types";
import { toast } from "@/store/toast.store";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: TaskWithProject | null;
}

export default function TaskModal({
  visible,
  onClose,
  onSuccess,
  taskToEdit,
}: Props) {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [members, setMembers] = useState<ProjectMemberWithEmployee[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>(TASK_PRIORITY.MEDIUM);
  const [status, setStatus] = useState<string>(TASK_STATUS.TODO);
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [estimatedHours, setEstimatedHours] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const loadMembers = useCallback(
    async (projId: string, preSelectMemberId?: string) => {
      try {
        const mData = await getProjectMembers(projId);
        setMembers(mData);
        if (preSelectMemberId) {
          setSelectedMemberId(preSelectMemberId);
        } else if (mData.length > 0) {
          setSelectedMemberId(mData[0].id);
        } else {
          setSelectedMemberId("");
        }
      } catch (err) {
        console.error(err);
      }
    },
    [],
  );

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);

      if (taskToEdit) {
        setSelectedProjectId(taskToEdit.project_id);
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setPriority(taskToEdit.priority || TASK_PRIORITY.MEDIUM);
        setStatus(taskToEdit.status || TASK_STATUS.TODO);
        setDueDate(taskToEdit.due_date ? taskToEdit.due_date.slice(0, 10) : "");
        setEstimatedHours(
          taskToEdit.estimated_hours ? String(taskToEdit.estimated_hours) : "",
        );
        loadMembers(taskToEdit.project_id, taskToEdit.project_member_id);
      } else if (data.length > 0) {
        const firstProj = data[0];
        setSelectedProjectId(firstProj.id);
        loadMembers(firstProj.id);
      }
    } catch (err) {
      console.error(err);
    }
  }, [taskToEdit, loadMembers]);

  useEffect(() => {
    if (visible) {
      Promise.resolve().then(() => {
        loadProjects();
      });
    }
  }, [visible, loadProjects]);

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    loadMembers(projId);
  };

  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !selectedProjectId ||
      !selectedMemberId ||
      !dueDate.trim()
    ) {
      toast.error(
        "Please fill in Task Title, Project, Member, and Due Date.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const profileId = await getAuthenticatedProfileId();
      if (!profileId) {
        toast.error("User not authenticated.");
        return;
      }

      const payload = {
        project_id: selectedProjectId,
        project_member_id: selectedMemberId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
        status: status as any,
        due_date: dueDate.trim(),
        estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
      };

      let res;
      if (taskToEdit) {
        res = await updateTask(taskToEdit.id, payload);
      } else {
        res = await createTask(profileId, payload);
      }

      if (res.success) {
        toast.success(res.message || "Task saved successfully.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to save task.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: adminColors.background,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: "85%",
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <AppText variant="h2" weight="700">
                {taskToEdit ? "Edit Task" : "Create Task"}
              </AppText>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Select Project */}
            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Select Project
            </AppText>
            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
              {projects.length === 0 ? (
                <AppText variant="caption" color={adminColors.textSecondary}>
                  No active projects available. Please create a project first.
                </AppText>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.xs }}
                >
                  {projects.map((p) => {
                    const isSel = selectedProjectId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => handleSelectProject(p.id)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                          borderRadius: radius.md,
                          backgroundColor: isSel
                            ? adminColors.primary
                            : adminColors.surface,
                          borderWidth: 1,
                          borderColor: isSel
                            ? adminColors.primary
                            : adminColors.border,
                        }}
                      >
                        <AppText
                          variant="caption"
                          weight="600"
                          color={isSel ? "#FFFFFF" : adminColors.textSecondary}
                        >
                          {p.project_name} ({p.project_code})
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Select Assignee Member */}
            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Assign to Employee (Project Member)
            </AppText>
            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
              {members.length === 0 ? (
                <AppText variant="caption" color={adminColors.danger}>
                  No members assigned to this project yet. Please assign members
                  in Projects tab first.
                </AppText>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.xs }}
                >
                  {members.map((m) => {
                    const isSel = selectedMemberId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setSelectedMemberId(m.id)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                          borderRadius: radius.md,
                          backgroundColor: isSel
                            ? adminColors.primary
                            : adminColors.surface,
                          borderWidth: 1,
                          borderColor: isSel
                            ? adminColors.primary
                            : adminColors.border,
                        }}
                      >
                        <AppText
                          variant="caption"
                          weight="600"
                          color={isSel ? "#FFFFFF" : adminColors.textSecondary}
                        >
                          {m.employee?.full_name || "Employee"} ({m.member_role}
                          )
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <Input
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Task Title "
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder=" description ..."
              multiline
              numberOfLines={3}
            />

            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Priority
            </AppText>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginBottom: spacing.lg,
              }}
            >
              {[
                TASK_PRIORITY.LOW,
                TASK_PRIORITY.MEDIUM,
                TASK_PRIORITY.HIGH,
                TASK_PRIORITY.URGENT,
              ].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.md,
                    alignItems: "center",
                    backgroundColor:
                      priority === p
                        ? adminColors.primary
                        : adminColors.surface,
                    borderWidth: 1,
                    borderColor:
                      priority === p ? adminColors.primary : adminColors.border,
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="600"
                    color={
                      priority === p ? "#FFFFFF" : adminColors.textSecondary
                    }
                  >
                    {p}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Selector */}
            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Status
            </AppText>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginBottom: spacing.lg,
              }}
            >
              {[
                TASK_STATUS.TODO,
                TASK_STATUS.IN_PROGRESS,
                TASK_STATUS.COMPLETED,
              ].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.md,
                    alignItems: "center",
                    backgroundColor:
                      status === s ? adminColors.primary : adminColors.surface,
                    borderWidth: 1,
                    borderColor:
                      status === s ? adminColors.primary : adminColors.border,
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="600"
                    color={status === s ? "#FFFFFF" : adminColors.textSecondary}
                  >
                    {s}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <DatePickerField
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Estimated Hours"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
              placeholder="e.g. 8"
              keyboardType="numeric"
            />

            <Button
              title={taskToEdit ? "Update Task" : "Create & Assign Task"}
              onPress={handleSubmit}
              loading={submitting}
              disabled={members.length === 0}
            />
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
}

