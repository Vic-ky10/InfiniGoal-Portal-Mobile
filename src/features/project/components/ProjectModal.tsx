import { useState, useEffect } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Input } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { ProjectWithMembers, PROJECT_PRIORITY, PROJECT_STATUS } from "../project.types";
import { createProject, updateProject, getAuthenticatedProfileId } from "../project.service";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: ProjectWithMembers | null;
}

export default function ProjectModal({
  visible,
  onClose,
  onSuccess,
  projectToEdit,
}: Props) {
  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>(PROJECT_PRIORITY.MEDIUM);
  const [status, setStatus] = useState<string>(PROJECT_STATUS.ACTIVE);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setProjectCode(projectToEdit.project_code || "");
      setProjectName(projectToEdit.project_name || "");
      setDescription(projectToEdit.description || "");
      setPriority(projectToEdit.priority || PROJECT_PRIORITY.MEDIUM);
      setStatus(projectToEdit.status || PROJECT_STATUS.ACTIVE);
      setStartDate(projectToEdit.start_date ? projectToEdit.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setEndDate(projectToEdit.end_date ? projectToEdit.end_date.slice(0, 10) : "");
    } else {
      setProjectCode(`PRJ${Math.floor(100 + Math.random() * 900)}`);
      setProjectName("");
      setDescription("");
      setPriority(PROJECT_PRIORITY.MEDIUM);
      setStatus(PROJECT_STATUS.ACTIVE);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate("");
    }
  }, [projectToEdit, visible]);

  const handleSubmit = async () => {
    if (!projectCode.trim() || !projectName.trim()) {
      Alert.alert("Validation Error", "Please fill in Project Code and Project Name.");
      return;
    }

    setSubmitting(true);
    try {
      const profileId = await getAuthenticatedProfileId();
      if (!profileId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const payload = {
        project_code: projectCode.trim(),
        project_name: projectName.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
        status: status as any,
        start_date: startDate,
        end_date: endDate.trim() || undefined,
      };

      let res;
      if (projectToEdit) {
        res = await updateProject(projectToEdit.id, payload);
      } else {
        res = await createProject(profileId, payload);
      }

      if (res.success) {
        Alert.alert("Success", res.message);
        onSuccess();
        onClose();
      } else {
        Alert.alert("Error", res.error || "Failed to save project.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
              {projectToEdit ? "Edit Project" : "Create Project"}
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={adminColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Project Code"
              value={projectCode}
              onChangeText={setProjectCode}
              placeholder="e.g. PRJ101"
            />
            <Input
              label="Project Name"
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g. Mobile App Redesign"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Project goals & scope"
              multiline
              numberOfLines={3}
            />

            {/* Priority Selector */}
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
              {[PROJECT_PRIORITY.LOW, PROJECT_PRIORITY.MEDIUM, PROJECT_PRIORITY.HIGH].map(
                (p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      alignItems: "center",
                      backgroundColor:
                        priority === p ? adminColors.primary : adminColors.surface,
                      borderWidth: 1,
                      borderColor:
                        priority === p ? adminColors.primary : adminColors.border,
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="600"
                      color={priority === p ? "#FFFFFF" : adminColors.textSecondary}
                    >
                      {p}
                    </AppText>
                  </TouchableOpacity>
                )
              )}
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
                PROJECT_STATUS.ACTIVE,
                PROJECT_STATUS.COMPLETED,
                PROJECT_STATUS.ON_HOLD,
                PROJECT_STATUS.ARCHIVED,
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

            <Input
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="End Date (Optional YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
            />

            <Button
              title={projectToEdit ? "Update Project" : "Create Project"}
              onPress={handleSubmit}
              loading={submitting}
            />
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
