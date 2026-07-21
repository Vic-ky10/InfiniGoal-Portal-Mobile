import { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Avatar, Badge, Button } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";
import { logout } from "@/features/auth/auth.service";

interface ProfileData {
  employee_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  department?: string;
  designation?: string;
  joining_date?: string;
}

export default function EmployeeProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("profiles")
          .select("employee_id, full_name, email, phone_number, department, designation, joining_date")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setProfile(data as ProfileData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/");
    } catch {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen isLoading={loading}>
      <View style={{ gap: spacing.lg }}>
        <AppHeader title="My Profile" subtitle="Your account & employee details" />

        {/* Profile Card */}
        <Card style={{ flexDirection: "row", alignItems: "center", paddingVertical: spacing.lg }}>
          <Avatar name={profile?.full_name ?? "Employee"} size={54} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <AppText weight="700" variant="h3">
              {profile?.full_name ?? "Employee User"}
            </AppText>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              {profile?.designation ?? "Team Member"}
            </AppText>
            <View style={{ marginTop: spacing.xs, flexDirection: "row", gap: spacing.xs }}>
              <Badge label={profile?.employee_id ?? "EMP"} color={employeeColors.primary} />
              <Badge label="Active Employee" color={employeeColors.primary} variant="subtle" />
            </View>
          </View>
        </Card>

        {/* Details Card */}
        <Card style={{ gap: spacing.md }}>
          <AppText variant="h3" weight="700">
            Personal Details
          </AppText>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="mail" size={18} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600">Email Address</AppText>
            </View>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              {profile?.email ?? "--"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="phone" size={18} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600">Phone Number</AppText>
            </View>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              {profile?.phone_number ?? "--"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="briefcase" size={18} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600">Department</AppText>
            </View>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              {profile?.department ?? "--"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="calendar" size={18} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600">Joining Date</AppText>
            </View>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              {profile?.joining_date ?? "--"}
            </AppText>
          </View>
        </Card>

        {/* Sign Out Button */}
        <TouchableOpacity
          disabled={loggingOut}
          onPress={handleLogout}
          style={{
            backgroundColor: `${employeeColors.danger}15`,
            borderWidth: 1,
            borderColor: employeeColors.danger,
            borderRadius: radius.md,
            paddingVertical: spacing.lg,
            alignItems: "center",
            marginTop: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="log-out" size={18} color={employeeColors.danger} style={{ marginRight: spacing.sm }} />
            <AppText weight="700" color={employeeColors.danger}>
              {loggingOut ? "Signing Out..." : "Sign Out of Account"}
            </AppText>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
