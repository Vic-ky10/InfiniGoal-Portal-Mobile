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
      <View style={{ gap: spacing.md, paddingBottom: spacing.xxl }}>
        {/* Employment */}
        <Card style={{ gap: spacing.lg, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700">Employment Details</AppText>
          <View style={{ gap: spacing.md }}>
            <DetailRow icon="briefcase" label="Department" value={employee.department} />
            <DetailRow icon="award" label="Designation" value={employee.designation} />
            <DetailRow icon="star" label="Role" value={employee.role} />
            <DetailRow icon="calendar" label="Joined Date" value={employee.joined_date ? new Date(employee.joined_date).toLocaleDateString() : null} />
            <DetailRow icon="clock" label="Experience (Years)" value={employee.experience_years?.toString()} />
          </View>
        </Card>

        {/* Personal Info */}
        <Card style={{ gap: spacing.lg, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700">Personal Information</AppText>
          <View style={{ gap: spacing.md }}>
            <DetailRow icon="mail" label="Email Address" value={employee.email} />
            <DetailRow icon="phone" label="Phone Number" value={employee.phone} />
            <DetailRow icon="calendar" label="Date of Birth" value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : null} />
          </View>
        </Card>

        {/* Address */}
        <Card style={{ gap: spacing.lg, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700">Address</AppText>
          <View style={{ gap: spacing.md }}>
            <DetailRow icon="map-pin" label="Current Address" value={employee.current_address} />
          </View>
        </Card>

        {/* Education */}
        <Card style={{ gap: spacing.lg, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700">Education</AppText>
          <View style={{ gap: spacing.md }}>
            <DetailRow icon="book-open" label="Qualification" value={employee.qualification} />
            <DetailRow icon="award" label="Degree" value={employee.degree} />
          </View>
        </Card>

        {/* Emergency Contact */}
        <Card style={{ gap: spacing.lg, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700">Emergency Contact</AppText>
          <View style={{ gap: spacing.md }}>
            <DetailRow icon="phone-call" label="Contact Number" value={employee.emergency_contact} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
        <Feather name={icon} size={18} color={adminColors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color={adminColors.textSecondary}>{label}</AppText>
        <AppText weight="600">{value || "Not provided"}</AppText>
      </View>
    </View>
  );
}
