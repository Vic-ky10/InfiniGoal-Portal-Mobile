import { useState, useEffect } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Card, Badge } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { ProjectWithMembers, PROJECT_MEMBER_ROLE } from "../project.types";
import {
  assignProjectMembers,
  removeProjectMember,
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
  const [memberRole, setMemberRole] = useState<string>(PROJECT_MEMBER_ROLE.DEVELOPER);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEmployees();
      setSelectedProfileIds([]);
    }
  }, [visible]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const toggleSelectEmployee = (id: string) => {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!project) return;
    if (selectedProfileIds.length === 0) {
      Alert.alert("Select Employee", "Please select at least one employee to assign.");
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
        member_role: memberRole as any,
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

  const handleRemoveMember = async (memberId: string, name: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${name} from this project?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const res = await removeProjectMember(memberId);
            if (res.success) {
              Alert.alert("Success", res.message);
              onSuccess();
            } else {
              Alert.alert("Error", res.error || "Failed to remove member.");
            }
          },
        },
      ]
    );
  };

  if (!project) return null;

  const activeMemberProfileIds = new Set(project.members?.map((m) => m.profile_id) ?? []);

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
            <View>
              <AppText variant="h2" weight="700">
                {project.project_name}
              </AppText>
              <AppText variant="caption" color={adminColors.textSecondary}>
                Code: {project.project_code} • Status: {project.status}
              </AppText>
            </View>

            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={adminColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Current Team Members */}
            <AppText weight="700" variant="h3" style={{ marginBottom: spacing.sm }}>
              Team Members ({project.members?.length ?? 0})
            </AppText>

            {(!project.members || project.members.length === 0) ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ marginBottom: spacing.md }}>
                No employees currently assigned to this project.
              </AppText>
            ) : (
              <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
                {project.members.map((m) => (
                  <Card
                    key={m.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: spacing.sm,
                    }}
                  >
                    <View>
                      <AppText weight="600">
                        {m.employee?.full_name || "Employee"}
                      </AppText>
                      <AppText variant="caption" color={adminColors.textSecondary}>
                        Role: {m.member_role} | Joined: {m.joined_date || m.assigned_at?.slice(0, 10) || "--"}
                      </AppText>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveMember(m.id, m.employee?.full_name || "Employee")
                      }
                      style={{ padding: spacing.xs }}
                    >
                      <Feather name="user-x" size={18} color={adminColors.danger} />
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>
            )}

            {/* Assign New Members */}
            <AppText weight="700" variant="h3" style={{ marginBottom: spacing.sm }}>
              Assign Employees
            </AppText>

            {/* Member Role Selector */}
            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Role on Project
            </AppText>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginBottom: spacing.md,
                flexWrap: "wrap",
              }}
            >
              {[
                PROJECT_MEMBER_ROLE.PROJECT_MANAGER,
                PROJECT_MEMBER_ROLE.DEVELOPER,
                PROJECT_MEMBER_ROLE.SALES,
                PROJECT_MEMBER_ROLE.MARKETING,
                PROJECT_MEMBER_ROLE.ANALYTICS,
                PROJECT_MEMBER_ROLE.OTHER,
              ].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setMemberRole(r)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.md,
                    alignItems: "center",
                    backgroundColor:
                      memberRole === r ? adminColors.primary : adminColors.surface,
                    borderWidth: 1,
                    borderColor:
                      memberRole === r ? adminColors.primary : adminColors.border,
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="600"
                    color={memberRole === r ? "#FFFFFF" : adminColors.textSecondary}
                  >
                    {r}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Select Employees
            </AppText>

            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
              {employees.map((emp) => {
                const isAlreadyMember = activeMemberProfileIds.has(emp.id);
                const isSelected = selectedProfileIds.includes(emp.id);

                if (isAlreadyMember) return null;

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
                      <AppText variant="caption" color={adminColors.textSecondary}>
                        {emp.employee_id} • {emp.designation || emp.role}
                      </AppText>
                    </View>
                    <Feather
                      name={isSelected ? "check-square" : "square"}
                      size={20}
                      color={isSelected ? adminColors.primary : adminColors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title={`Assign ${selectedProfileIds.length} Selected Employee(s)`}
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
