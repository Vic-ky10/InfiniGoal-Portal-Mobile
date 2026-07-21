import { View } from "react-native";
import { useRouter } from "expo-router";

import { AppText, Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";

import {
  NotificationCard,
  QuickActionCard,
  RecentActivity,
  StatCard,
  WelcomeCard,
} from "../components";

import { useDashboard } from "../hooks/useDashboard";

import { adminColors, spacing } from "@/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();

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
      />

      <WelcomeCard name="Administrator" />

     


      <AppText variant="h3" weight="700" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
        Overview
      </AppText>

      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <StatCard
          
            title="Total Employees"
            value={data?.totalEmployees ?? 0}
            icon="users"
            color={adminColors.primary}
            
          />
          <StatCard
            title="Present Today"
            value={data?.presentToday ?? 0}
            icon="check-circle"
            color={adminColors.success}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <StatCard
            title="Pending Leaves"
            value={data?.pendingLeaves ?? 0}
            icon="calendar"
            color={adminColors.warning}
          />
          <StatCard
            title="Pending Expenses"
            value={data?.pendingExpenses ?? 0}
            icon="dollar-sign"
            color={adminColors.danger}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <StatCard
            title="Active Projects"
            value={data?.activeProjects ?? 0}
            icon="briefcase"
            color={adminColors.info}
          />
          <StatCard
            title="Total Tasks"
            value={data?.totalTasks ?? 0}
            icon="check-square"
            color={adminColors.primaryLight}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <StatCard
            title="Announcements"
            value={data?.totalAnnouncements ?? 0}
            icon="bell"
            color={adminColors.secondary}
          />
          <StatCard
            title="Unread Alerts"
            value={data?.unreadNotifications ?? 0}
            icon="message-square"
            color={adminColors.warning}
          />
        </View>
      </View>

      {/* Quick Actions */} 

      <AppText variant="h3" weight="700" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
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

      {/* Notifications & Recent Activity */}
      <AppText variant="h3" weight="700" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
        Activity & Alerts
      </AppText>

      <View style={{ gap: spacing.sm }}>
        {(data?.pendingLeaves ?? 0) > 0 ? (
          <NotificationCard
            title={`${data?.pendingLeaves} Leave request(s) waiting for approval`}
          />
        ) : (
          <NotificationCard
            title="All leave requests are up to date"
          />
        )}

        <RecentActivity
          title="System initialized"
          time="Just now"
        />
      </View>
    </Screen>
  );
}