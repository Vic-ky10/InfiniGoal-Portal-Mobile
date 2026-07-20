import { View } from "react-native";

import { Loader, Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";

import {
  NotificationCard,
  QuickActionCard,
  RecentActivity,
  StatCard,
  WelcomeCard,
} from "../components";

import { useDashboard } from "../hooks/useDashboard";

import { spacing } from "@/theme";

export default function DashboardScreen() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <Loader />;

  return (
    <Screen>
      <AppHeader
        title="Dashboard"
        subtitle="InfiniGoal Admin Portal"
      />

      <WelcomeCard name="Administrator" />

      <View style={{ marginTop: spacing.lg }}>
        <StatCard
          title="Employees"
          value={data?.totalEmployees ?? 0}
        />

        <View style={{ height: spacing.md }} />

        <StatCard
          title="Present Today"
          value={data?.presentToday ?? 0}
        />

        <View style={{ height: spacing.md }} />

        <StatCard
          title="Pending Leaves"
          value={data?.pendingLeaves ?? 0}
        />

        <View style={{ height: spacing.md }} />

        <StatCard
          title="Pending Expenses"
          value={data?.pendingExpenses ?? 0}
        />
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <QuickActionCard
          title="Employees"
          onPress={() => {}}
        />

        <View style={{ height: spacing.md }} />

        <QuickActionCard
          title="Attendance"
          onPress={() => {}}
        />

        <View style={{ height: spacing.md }} />

        <QuickActionCard
          title="Expenses"
          onPress={() => {}}
        />
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <NotificationCard
          title="2 Leave requests waiting for approval"
        />

        <View style={{ height: spacing.md }} />

        <RecentActivity
          title="Employee joined"
          time="5 min ago"
        />

        <View style={{ height: spacing.md }} />

        <RecentActivity
          title="Expense approved"
          time="30 min ago"
        />
      </View>
    </Screen>
  );
}