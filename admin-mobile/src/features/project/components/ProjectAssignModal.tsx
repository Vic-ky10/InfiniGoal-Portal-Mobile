import { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Card, Badge } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { ProjectWithMembers } from "../project.types";
import {
  assignProjectMembers,
  getAuthenticatedProfileId,
} from "../project.service";
import { getEmployees } from "@/features/employee/employee.service";
import { Employee } from "@/features/employee/employee.types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: ProjectWithMembers | null;
}

export default function ProjectAssignModal({
  visible,
  onClose,
  onSuccess,
  project,
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const loadEmployees = useCallback(async () => {
    await Promise.resolve();
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      Promise.resolve().then(() => {
        loadEmployees();
        setSelectedProfileIds([]);
      });
    }
  }, [visible, loadEmployees]);

  const toggleSelectEmployee = (id: string) => {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const handleAssign = async () => {
    if (!project) return;
    if (selectedProfileIds.length === 0) {
      Alert.alert(
        "Select Employee",
        "Please select at least one employee to assign.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const profileId = await getAuthenticatedProfileId();
      if (!profileId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const res = await assignProjectMembers(profileId, {
        projectId: project.id,
        profileIds: selectedProfileIds,
        // member_role: "Member",
      });

      if (res.success) {
        Alert.alert("Success", res.message);
        setSelectedProfileIds([]);
        onSuccess();
      } else {
        Alert.alert("Error", res.error || "Failed to assign members.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeMemberProfileIds = useMemo(
    () => new Set(project?.members?.map((m) => m.profile_id) ?? []),
    [project],
  );

  if (!project) return null;

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
          <Card
            style={{
              marginBottom: spacing.lg,
              backgroundColor: adminColors.primary,
              borderRadius: radius.lg,
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <AppText variant="h2" weight="700" color="#FFF">
                  Project : {project.project_name}
                </AppText>

                <AppText
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  style={{ marginTop: spacing.xs }}
                ></AppText>
              </View>

              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                marginTop: spacing.md,
              }}
            >
              <AppText variant="caption" weight="500" color="#FFF">
                Status : {project.status}
              </AppText>

              <Badge label={project.priority} variant="subtle" />
            </View>
          </Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            {/* <View>
              <AppText variant="h2" weight="700">
                {project.project_name}
              </AppText>
              <AppText variant="caption" color={adminColors.textSecondary}>
                Code: {project.project_code} • Status: {project.status}
              </AppText>
            </View> */}

            {/* <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={adminColors.textSecondary} />
            </TouchableOpacity> */}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.lg,
              }}
            >
              <Card
                style={{
                  flex: 1,
                  marginRight: spacing.xs,
                  alignItems: "center",
                  padding: spacing.md,
                }}
              >
                <AppText variant="h2" weight="700">
                  {project.members.length}
                </AppText>

                <AppText variant="caption">Members</AppText>
              </Card>

              <Card
                style={{
                  flex: 1,
                  marginHorizontal: spacing.xs,
                  alignItems: "center",
                  padding: spacing.md,
                }}
              >
                <AppText variant="h2" weight="700">
                  {employees.length}
                </AppText>

                <AppText variant="caption">Employees</AppText>
              </Card>

              <Card
                style={{
                  flex: 1,
                  marginLeft: spacing.xs,
                  alignItems: "center",
                  padding: spacing.md,
                }}
              >
                <AppText variant="h2" weight="700">
                  {selectedProfileIds.length}
                </AppText>

                <AppText variant="caption">Selected</AppText>
              </Card>
            </View>
            {/* Current Team Members */}
            {/* Current Team Members */}
            <AppText
              weight="700"
              variant="h3"
              style={{ marginBottom: spacing.sm }}
            >
              Team Members ({project.members?.length ?? 0})
            </AppText>

            {!project.members || project.members.length === 0 ? (
              <AppText
                variant="caption"
                color={adminColors.textSecondary}
                style={{ marginBottom: spacing.md }}
              >
                No employees currently assigned to this project.
              </AppText>
            ) : (
              <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
                {project.members.map((m) => (
                  <Card
                    key={m.id}
                    style={{
                      padding: spacing.md,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: adminColors.border,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <AppText weight="600">
                      {m.employee?.full_name || "Employee"}
                    </AppText>

                    <AppText
                      variant="caption"
                      color={adminColors.textSecondary}
                    >
                      Role: {m.member_role}
                    </AppText>

                    <AppText
                      variant="caption"
                      color={adminColors.textSecondary}
                    >
                      Joined:{" "}
                      {m.joined_date || m.assigned_at?.slice(0, 10) || "--"}
                    </AppText>
                  </Card>
                ))}
              </View>
            )}

            {!project.members || project.members.length === 0 ? (
              <AppText
                variant="caption"
                color={adminColors.textSecondary}
                style={{ marginBottom: spacing.md }}
              >
                No employees currently assigned to this project.
              </AppText>
            ) : (
              <View
                style={{ gap: spacing.xs, marginBottom: spacing.lg }}
              ></View>
            )}

            {/* Assign New Members */}
            <AppText
              weight="700"
              variant="h3"
              style={{ marginBottom: spacing.sm }}
            >
              Select Employees
            </AppText>

            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
              {employees.map((emp) => {
                const isSelected = selectedProfileIds.includes(emp.id);

                return (
                  <TouchableOpacity
                    key={emp.id}
                    onPress={() => toggleSelectEmployee(emp.id)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: spacing.md,
                      borderRadius: radius.md,
                      backgroundColor: isSelected
                        ? `${adminColors.primary}15`
                        : adminColors.surface,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? adminColors.primary
                        : adminColors.border,
                    }}
                  >
                    <View>
                      <AppText weight="600">{emp.full_name}</AppText>
                      <AppText
                        variant="caption"
                        color={adminColors.textSecondary}
                      >
                        {emp.employee_id} • {emp.designation || emp.role}
                      </AppText>
                    </View>
                    <Feather
                      name={isSelected ? "check-square" : "square"}
                      size={20}
                      color={
                        isSelected
                          ? adminColors.primary
                          : adminColors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title={`Assign ${selectedProfileIds.length} Selected Employees`}
              onPress={handleAssign}
              loading={submitting}
              disabled={selectedProfileIds.length === 0}
            />
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
