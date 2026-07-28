import { View } from "react-native";
import { useRouter } from "expo-router";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, NotificationBell } from "@/components/common";
import { Image } from "react-native";
import {
  NotificationCard,
  QuickActionCard,
  RecentActivity,
  StatCard,
  WelcomeCard,
} from "../components";

import { useDashboard } from "../hooks/useDashboard";

import { adminColors, spacing } from "@/theme";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();
  const [adminName, setAdminName] = useState("Administrator");
  const [designation, setDesignation] = useState("System Administrator");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
  };

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
      <AppText
        variant="h3"
        weight="700"
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      >
        Overview
      </AppText>

      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <StatCard
            title="Total Employees"
            value={data?.totalEmployees ?? 0}
            icon="users"
            color={adminColors.primary}
            onPress={() => router.push("/(admin)/employees")}
          />
          <StatCard
            title="Present Today "
            value={data?.attendanceToday ?? "0 / 0"}
            icon= "check-circle"
            color={adminColors.success}
            onPress={() => router.push("/(admin)/attendance")}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
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

        <View style={{ flexDirection: "row", gap: spacing.md }}>
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

        <View style={{ flexDirection: "row", gap: spacing.md }}>
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

      {/* Quick Actions */}

      <AppText
        variant="h3"
        weight="700"
        style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}
      >
        Quick Management
      </AppText>

      <View style={{ gap: spacing.sm }}>
        <QuickActionCard
          title="Employees"
          subtitle="Manage directory & profiles"
          icon="users"
          onPress={() => router.push("/(admin)/employees")}
        />

        <QuickActionCard
          title="Attendance"
          subtitle="View records & logins"
          icon="clock"
          onPress={() => router.push("/(admin)/attendance")}
        />

        <QuickActionCard
          title="Leave Requests"
          subtitle="Review & approve leave applications"
          icon="calendar"
          onPress={() => router.push("/(admin)/leave")}
        />

        <QuickActionCard
          title="Expenses"
          subtitle="Review claims & reimbursements"
          icon="credit-card"
          onPress={() => router.push("/(admin)/expenses")}
        />

        <QuickActionCard
          title="Projects"
          subtitle="Monitor active project progress"
          icon="folder"
          onPress={() => router.push("/(admin)/projects")}
        />
      </View>
    </Screen>
  );
}
