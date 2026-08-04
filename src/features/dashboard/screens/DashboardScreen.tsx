import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, NotificationBell } from "@/components/common";
import {
  QuickActionCard,
  SalesRevenueSection,
  StatCard,
  WelcomeCard,
} from "../components";

import { useDashboard } from "../hooks/useDashboard";

import { adminColors, spacing } from "@/theme";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface SectionHeaderProps {
  title: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
}

function SectionHeader({
  title,
  icon,
  iconColor = adminColors.primary,
  iconBg,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIconBg,
          { backgroundColor: iconBg ?? `${iconColor}15` },
        ]}
      >
        <Feather name={icon as any} size={14} color={iconColor} />
      </View>
      <AppText variant="h3" weight="700">
        {title}
      </AppText>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();
  const [adminName, setAdminName] = useState("Administrator");
  const [designation, setDesignation] = useState("System Administrator");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, designation, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setAdminName(profile.full_name ?? "Administrator");
      setDesignation(profile.designation ?? "System Administrator");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
    });
  }, [loadProfile]);

  return (
    <Screen
      isLoading={isLoading}
      isError={isError}
      errorMessage="Unable to load dashboard data. Please check your connection."
      onRetry={refetch}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <AppHeader
        title="Dashboard"
        subtitle="InfiniGoal Admin Portal"
        rightComponent={
          <NotificationBell count={data?.unreadNotifications ?? 0} />
        }
      />

      <WelcomeCard
        name={adminName}
        designation={designation}
        avatarUrl={avatarUrl}
      />

      {/*  overview Stats  */}
      <SectionHeader title="Overview" icon="grid" />

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Employees"
            value={data?.totalEmployees ?? 0}
            icon="users"
            color={adminColors.primary}
            onPress={() => router.push("/(admin)/employees")}
          />
          <StatCard
            title="Present Today"
            value={data?.attendanceToday ?? "0 / 0"}
            icon="check-circle"
            color={adminColors.success}
            onPress={() => router.push("/(admin)/attendance")}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Pending Leaves"
            value={data?.pendingLeaves ?? 0}
            icon="calendar"
            color={adminColors.warning}
            onPress={() => router.push("/(admin)/leave")}
          />
          <StatCard
            title="Pending Expenses"
            value={data?.pendingExpenses ?? 0}
            icon="dollar-sign"
            color={adminColors.danger}
            onPress={() => router.push("/(admin)/expenses")}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Active Projects"
            value={data?.activeProjects ?? 0}
            icon="briefcase"
            color={adminColors.info}
            onPress={() => router.push("/(admin)/projects")}
          />
          <StatCard
            title="Total Tasks"
            value={data?.totalTasks ?? 0}
            icon="check-square"
            color={adminColors.primaryLight}
            onPress={() => router.push("/(admin)/tasks")}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Announcements"
            value={data?.totalAnnouncements ?? 0}
            icon="bell"
            color={adminColors.secondary}
            onPress={() => router.push("/(admin)/announcements")}
          />
          <StatCard
            title="Unread Alerts"
            value={data?.unreadNotifications ?? 0}
            icon="message-square"
            color={adminColors.warning}
            onPress={() => router.push("/(admin)/notifications")}
          />
        </View>
      </View>

     
 <View style={{ marginTop: spacing.xxl }}>
  <SalesRevenueSection />
</View>

   {/* quick Management */}
      <SectionHeader
        title="Quick Management"
        icon="zap"
        iconColor={adminColors.warning}
        iconBg={`${adminColors.warning}15`}
      />

      <View style={styles.quickActions}>
        <QuickActionCard
          title="Employees"
          subtitle="Manage directory & profiles"
          icon="users"
          accentColor={adminColors.primary}
          onPress={() => router.push("/(admin)/employees")}
        />

        <QuickActionCard
          title="Attendance"
          subtitle="View records & logins"
          icon="clock"
          accentColor={adminColors.success}
          onPress={() => router.push("/(admin)/attendance")}
        />

        <QuickActionCard
          title="Leave Requests"
          subtitle="Review & approve leave applications"
          icon="calendar"
          accentColor={adminColors.warning}
          onPress={() => router.push("/(admin)/leave")}
        />

        <QuickActionCard
          title="Expenses"
          subtitle="Review claims & reimbursements"
          icon="credit-card"
          accentColor={adminColors.danger}
          onPress={() => router.push("/(admin)/expenses")}
        />

        <QuickActionCard
          title="Projects"
          subtitle="Monitor active project progress"
          icon="folder"
          accentColor={adminColors.info}
          onPress={() => router.push("/(admin)/projects")}
        />

        <QuickActionCard
          title="Sales"
          subtitle="Customers, purchases & revenue"
          icon="trending-up"
          accentColor={adminColors.secondary ?? adminColors.primaryLight ?? adminColors.primary}
          onPress={() => router.push("/(admin)/sales")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickActions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
});
