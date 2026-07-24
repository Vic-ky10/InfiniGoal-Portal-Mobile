import { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Button, Avatar, Badge } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { adminColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";
import { logout } from "@/features/auth/auth.service";

export default function SettingsScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email ?? "Admin User");
      }
    });
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
    <Screen>
      <View style={{ gap: spacing.lg }}>
        <AppHeader title="Settings" subtitle="System preferences & account settings" />

        {/* Profile Card */}
        <Card
          style={{
            alignItems: "center",
            paddingVertical: spacing.xl,
            borderWidth: 1,
            borderColor: adminColors.border,
            overflow: "hidden",
            position: "relative",
            ...shadows.sm,
          }}
        >
          {/* Subtle Accent Background Banner */}
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
            <Avatar name={userEmail ?? "Admin"} size={80} />
          </View>

          <AppText weight="700" variant="h2" style={{ marginTop: spacing.md }}>
            Administrator
          </AppText>
          <AppText variant="body" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
            {userEmail ?? "admin@infinigoal.com"}
          </AppText>

          <View style={{ marginTop: spacing.sm }}>
            <Badge label="Super Admin" color={adminColors.primary} />
          </View>
        </Card>

        {/* App Settings Group */}
        <Card style={{ gap: spacing.md, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700" style={{ marginBottom: spacing.xs }}>
            Application Preferences
          </AppText>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
                <Feather name="shield" size={18} color={adminColors.primary} />
              </View>
              <View>
                <AppText weight="600">Portal Mode</AppText>
                <AppText variant="caption" color={adminColors.textSecondary}>Admin Control Center</AppText>
              </View>
            </View>
            <Badge label="Blue Theme" color={adminColors.primary} variant="subtle" />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
                <Feather name="bell" size={18} color={adminColors.primary} />
              </View>
              <View>
                <AppText weight="600">Push Notifications</AppText>
                <AppText variant="caption" color={adminColors.textSecondary}>Real-time system alerts</AppText>
              </View>
            </View>
            <Badge label="Enabled" color={adminColors.success} variant="subtle" />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${adminColors.primary}10`, justifyContent: "center", alignItems: "center", marginRight: spacing.md }}>
                <Feather name="info" size={18} color={adminColors.primary} />
              </View>
              <View>
                <AppText weight="600">App Version</AppText>
                <AppText variant="caption" color={adminColors.textSecondary}>InfiniGoal Admin v1.0.0</AppText>
              </View>
            </View>
            <AppText variant="caption" color={adminColors.textSecondary}>v1.0.0</AppText>
          </View>
        </Card>

        {/* Sign Out Section */}
        <TouchableOpacity
          disabled={loggingOut}
          onPress={handleLogout}
          style={{
            backgroundColor: "#EF44440F",
            borderWidth: 1.5,
            borderColor: "#EF444433",
            borderRadius: radius.md,
            paddingVertical: spacing.lg,
            alignItems: "center",
            marginTop: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="log-out" size={18} color="#EF4444" style={{ marginRight: spacing.sm }} />
            <AppText weight="700" color="#EF4444">
              {loggingOut ? "Signing Out..." : "Sign Out of Account"}
            </AppText>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}