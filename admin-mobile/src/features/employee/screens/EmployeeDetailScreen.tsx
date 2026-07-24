import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { EmptyState, AppHeader } from "@/components/common";
import { Loader, Screen, AppText, Card, Avatar, Badge } from "@/components/ui";
import { adminColors, radius, spacing, shadows } from "@/theme";
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
      <Card
        style={{
          alignItems: "center",
          paddingVertical: spacing.xl,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: adminColors.border,
          overflow: "hidden",
          position: "relative",
          ...shadows.sm,
        }}
      >
        {/* Curved Header Banner Background */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 70,
            backgroundColor: `${adminColors.primary}10`,
          }}
        />

        <View style={{ marginTop: 16 }}>
          <Avatar uri={employee.avatar_url} name={employee.full_name} size={96} />
        </View>

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
            variant="subtle"
          />
        </View>
      </Card>

      {/* Details List */}
      <Card style={{ gap: spacing.lg, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
        <AppText variant="h3" weight="700">
          Information & Contact
        </AppText>

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
              <Feather name="mail" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Email Address</AppText>
              <AppText weight="600">{employee.email}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
              <Feather name="phone" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Phone Number</AppText>
              <AppText weight="600">{employee.phone ?? "Not provided"}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
              <Feather name="briefcase" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Department</AppText>
              <AppText weight="600">{employee.department ?? "Unassigned"}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
              <Feather name="calendar" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={adminColors.textSecondary}>Joined Date</AppText>
              <AppText weight="600">{employee.joined_date ? new Date(employee.joined_date).toLocaleDateString() : "Not available"}</AppText>
            </View>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
