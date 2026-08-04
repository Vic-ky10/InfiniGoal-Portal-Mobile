import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, NotificationBell } from "@/components/common";
import {
  WelcomeCard,
  StatCard,
  QuickActionCard,
  SalesRevenueSection,
} from "@/features/dashboard/components";
import { useEmployeeDashboard } from "@/features/dashboard/hooks/useEmployeeDashboard";
import { useThemeColors, employeeColors, spacing } from "@/theme";
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
  iconColor,
  iconBg,
}: SectionHeaderProps) {
  const colors = useThemeColors();
  const activeColor = iconColor || colors.primary;
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIconBg,
          { backgroundColor: iconBg ?? `${activeColor}15` },
        ]}
      >
        <Feather name={icon as any} size={14} color={activeColor} />
      </View>
      <AppText variant="h3" weight="700" color={colors.text}>
        {title}
      </AppText>
    </View>
  );
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const colors = useThemeColors();

  const [employeeName, setEmployeeName] = useState("Employee");
  const [designation, setDesignation] = useState("Team Member");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");

  const { data, isLoading, isError, refetch, isRefetching } = useEmployeeDashboard(userId);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, designation, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setEmployeeName(profile.full_name ?? "Employee");
      setDesignation(profile.designation ?? "Team Member");
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
      isLoading={isLoading || !userId}
      isError={isError}
      errorMessage="Unable to load dashboard data. Please check your connection."
      onRetry={refetch}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <AppHeader
        title="Dashboard"
        subtitle="InfiniGoal Employee Portal"
        rightComponent={
          <NotificationBell
            count={data?.unreadNotifications ?? 0}
            route="/(employee)/notifications"
            surfaceColor={employeeColors.surface}
            iconColor={employeeColors.text}
            badgeColor={employeeColors.danger}
          />
        }
      />

      <WelcomeCard
        name={employeeName}
        designation={designation}
        avatarUrl={avatarUrl}
        portalName="Employee Portal"
        theme="employee"
      />

      {/* Overview Stats */}
      <SectionHeader title="Overview" icon="grid" />

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            title="My Attendance"
            value={data?.todayStatus ?? "Not Logged In"}
            icon="clock"
            color={colors.primary}
            theme="employee"
            onPress={() => router.push("/(employee)/attendance")}
          />
          <StatCard
            title="My Leaves"
            value={data?.pendingLeaves ?? 0}
            icon="calendar"
            color={colors.warning}
            theme="employee"
            onPress={() => router.push("/(employee)/leave")}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="My Expenses"
            value={data?.pendingExpenses ?? 0}
            icon="dollar-sign"
            color={colors.danger}
            theme="employee"
            onPress={() => router.push("/(employee)/expenses")}
          />
          <StatCard
            title="My Projects"
            value={data?.myProjects ?? 0}
            icon="folder"
            color={colors.info}
            theme="employee"
            onPress={() => router.push("/(employee)/projects")}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="My Tasks"
            value={data?.activeTasks ?? 0}
            icon="check-square"
            color={colors.primaryLight ?? colors.primary}
            theme="employee"
            onPress={() => router.push("/(employee)/tasks")}
          />
          <StatCard
            title="Announcements"
            value={data?.announcementsCount ?? 0}
            icon="bell"
            color={colors.secondary ?? colors.primaryLight}
            theme="employee"
            onPress={() => router.push("/(employee)/announcements")}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Incentives"
            value={data?.incentivesCount ?? 0}
            icon="award"
            color={colors.primary}
            theme="employee"
            onPress={() => router.push("/(employee)/incentives")}
          />
          <StatCard
            title="Unread Alerts"
            value={data?.unreadNotifications ?? 0}
            icon="message-square"
            color={colors.warning}
            theme="employee"
            onPress={() => router.push("/(employee)/notifications")}
          />
        </View>
      </View>

      {/* Sales Revenue Chart */}
      <View style={{ marginTop: spacing.xxl }}>
        <SalesRevenueSection
          mode="employee"
          userId={userId}
          theme="employee"
        />
      </View>

      {/* Quick Actions */}
      <SectionHeader
        title="Quick Actions"
        icon="zap"
        iconColor={colors.warning}
        iconBg={`${colors.warning}15`}
      />

      <View style={styles.quickActions}>
        <QuickActionCard
          title="Attendance"
          subtitle="Clock in/out & view log history"
          icon="clock"
          theme="employee"
          onPress={() => router.push("/(employee)/attendance")}
        />

        <QuickActionCard
          title="Leave Requests"
          subtitle="Apply for leave & track approval status"
          icon="calendar"
          theme="employee"
          onPress={() => router.push("/(employee)/leave")}
        />

        <QuickActionCard
          title="Expenses"
          subtitle="Submit expense claims & reimbursements"
          icon="credit-card"
          theme="employee"
          onPress={() => router.push("/(employee)/expenses")}
        />

        <QuickActionCard
          title="Projects"
          subtitle="View details & active project status"
          icon="folder"
          theme="employee"
          onPress={() => router.push("/(employee)/projects")}
        />

        <QuickActionCard
          title="Tasks"
          subtitle="Manage your to-do lists & assignments"
          icon="check-square"
          theme="employee"
          onPress={() => router.push("/(employee)/tasks")}
        />

        <QuickActionCard
          title="Sales"
          subtitle="Track buyers, invoices & monthly revenue"
          icon="trending-up"
          theme="employee"
          onPress={() => router.push("/(employee)/sales")}
        />

        <QuickActionCard
          title="Announcements"
          subtitle="Stay informed with company announcements"
          icon="bell"
          theme="employee"
          onPress={() => router.push("/(employee)/announcements")}
        />

        <QuickActionCard
          title="Notifications"
          subtitle="View your direct messages & unread alerts"
          icon="message-square"
          theme="employee"
          onPress={() => router.push("/(employee)/notifications")}
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
