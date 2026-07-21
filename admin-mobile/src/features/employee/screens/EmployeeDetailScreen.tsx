import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { EmptyState, AppHeader } from "@/components/common";
import { Loader, Screen, AppText, Card, Avatar, Badge } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { useEmployee } from "../hooks/useEmployees";

export default function EmployeeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();
  const employeeId = Array.isArray(id) ? id[0] : id;
  const { employee, loading, refresh } = useEmployee(employeeId);

  if (loading) {
    return (
      <Screen scroll={false} isLoading={true}>
        <Loader />
      </Screen>
    );
  }

  if (!employee) {
    return (
      <Screen>
        <AppHeader title="Employee Profile" onBack={() => router.back()} showMenuButton={false} />
        <EmptyState title="Employee not found." />
      </Screen>
    );
  }

  const isActive = employee.status === "Active";

  return (
    <Screen onRefresh={refresh}>
      <AppHeader
        title="Employee Profile"
        subtitle={employee.employee_id}
        onBack={() => router.back()}
        showMenuButton={false}
      />

      {/* Main Profile Card */}
      <Card style={{ alignItems: "center", paddingVertical: spacing.xxl, marginBottom: spacing.lg }}>
        <Avatar uri={employee.avatar_url} name={employee.full_name} size={80} />

        <AppText variant="h2" weight="700" style={{ marginTop: spacing.md }}>
          {employee.full_name}
        </AppText>

        <AppText color={adminColors.textSecondary} variant="body" style={{ marginTop: spacing.xs }}>
          {employee.designation || employee.role}
        </AppText>

        <View style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.xs }}>
          <Badge
            label={employee.status}
            color={isActive ? adminColors.success : adminColors.disabled}
          />
          <Badge
            label={employee.role.toUpperCase()}
            color={adminColors.primary}
          />
        </View>
      </Card>

      {/* Details List */}
      <Card style={{ gap: spacing.lg }}>
        <AppText variant="h3" weight="700">
          Information & Contact
        </AppText>

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ padding: spacing.sm, backgroundColor: adminColors.background, borderRadius: radius.md, marginRight: spacing.md }}>
              <Feather name="mail" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Email Address</AppText>
              <AppText weight="500">{employee.email}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ padding: spacing.sm, backgroundColor: adminColors.background, borderRadius: radius.md, marginRight: spacing.md }}>
              <Feather name="phone" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Phone Number</AppText>
              <AppText weight="500">{employee.phone ?? "Not provided"}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ padding: spacing.sm, backgroundColor: adminColors.background, borderRadius: radius.md, marginRight: spacing.md }}>
              <Feather name="briefcase" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Department</AppText>
              <AppText weight="500">{employee.department ?? "Unassigned"}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ padding: spacing.sm, backgroundColor: adminColors.background, borderRadius: radius.md, marginRight: spacing.md }}>
              <Feather name="calendar" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Joined Date</AppText>
              <AppText weight="500">{employee.joined_date ?? "Not available"}</AppText>
            </View>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
