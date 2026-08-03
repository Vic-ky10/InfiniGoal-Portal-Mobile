import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useEmployeeSalesDashboardData } from "@/features/sales/hooks/useEmployeeSales";
import StatCard from "@/features/dashboard/components/StatCard";
import QuickActionCard from "@/features/dashboard/components/QuickActionCard";

export default function EmployeeSalesDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useEmployeeSalesDashboardData(user?.id || "");

  const handleRefresh = async () => {
    await refetch();
  };

  const employeeColor = "#22C55E"; // Green accent for employee portal

  const chartData = useMemo(() => {
    return dashboard?.monthlyTrend || [];
  }, [dashboard]);

  const maxChartAmount = useMemo(() => {
    const amounts = chartData.map((d) => d.amount);
    return Math.max(...amounts, 10000);
  }, [chartData]);

  return (
    <Screen
      isLoading={isLoading}
      isError={isError}
      errorMessage="Unable to load your sales metrics. Please try again."
      onRetry={handleRefresh}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
    >
      <AppHeader
        title="My Sales Portal"
        subtitle="Sales logs, assigned clients & incentives"
        showMenuButton={true}
      />

      {/* Stats Summary Cards */}
      <AppText variant="h3" weight="700" style={styles.sectionTitle}>
        Performance Overview
      </AppText>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            title="My Monthly Sales"
            value={`₹${(dashboard?.stats?.monthlyRevenue || 0).toLocaleString("en-IN")}`}
            icon="trending-up"
            color={employeeColor}
          />
          <StatCard
            title="Earned Incentives"
            value={`₹${(dashboard?.stats?.earnedIncentives || 0).toLocaleString("en-IN")}`}
            icon="award"
            color={adminColors.warning}
          />
        </View>

        <View style={styles.row}>
          <StatCard
            title="My Clients"
            value={(dashboard?.stats?.totalCustomers || 0).toString()}
            icon="users"
            color={adminColors.secondary}
          />
          <StatCard
            title="Logged Invoices"
            value={(dashboard?.stats?.totalPurchases || 0).toString()}
            icon="shopping-cart"
            color={adminColors.info}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Quick Operations
      </AppText>
      <View style={styles.actionsContainer}>
        <QuickActionCard
          title="My Customers Directory"
          subtitle="View and edit your assigned buyer profiles"
          icon="users"
          onPress={() => router.push("/(employee)/sales/customers")}
        />
        <QuickActionCard
          title="Record New Invoices"
          subtitle="Log purchases and review incentive payout status"
          icon="shopping-cart"
          onPress={() => router.push("/(employee)/sales/purchases")}
        />
      </View>

      {/* Revenue Trend Chart */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Monthly Sales Revenue
      </AppText>
      <Card style={styles.chartCard}>
        <AppText variant="caption" color={adminColors.textSecondary} style={{ marginBottom: spacing.md }}>
          Approved client purchases revenue generated over the last 6 months
        </AppText>

        <View style={styles.chartContainer}>
          {chartData.length === 0 ? (
            <AppText style={styles.emptyText}>No monthly sales trends recorded.</AppText>
          ) : (
            chartData.map((data, idx) => {
              const heightPercent = (data.amount / maxChartAmount) * 100;
              return (
                <View key={idx} style={styles.barWrapper}>
                  {/* Tooltip value */}
                  <View style={styles.tooltip}>
                    <AppText style={{ fontSize: 9, fontWeight: "700", color: "#FFFFFF" }}>
                      ₹{Math.round(data.amount / 1000)}k
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${Math.max(heightPercent, 5)}%`,
                        backgroundColor: employeeColor,
                      },
                    ]}
                  />
                  <AppText variant="caption" style={styles.barLabel}>
                    {data.label}
                  </AppText>
                </View>
              );
            })
          )}
        </View>
      </Card>

      {/* Upcoming Followups */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Upcoming Follow-ups
      </AppText>
      <Card style={styles.listCard}>
        {dashboard?.upcomingFollowups?.length === 0 ? (
          <AppText style={styles.emptyText}>No upcoming follow-ups scheduled.</AppText>
        ) : (
          dashboard?.upcomingFollowups?.map((followup: any) => (
            <View key={followup.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <AppText weight="700" color={adminColors.text}>
                  {followup.customerName}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                  Type: {followup.type} • Target: {followup.date}
                </AppText>
              </View>
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      followup.priority === "High"
                        ? "rgba(239, 68, 68, 0.1)"
                        : followup.priority === "Medium"
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(34, 197, 94, 0.1)",
                  },
                ]}
              >
                <AppText
                  weight="700"
                  style={{
                    fontSize: 10,
                    color:
                      followup.priority === "High"
                        ? adminColors.danger
                        : followup.priority === "Medium"
                        ? adminColors.warning
                        : employeeColor,
                  }}
                >
                  {followup.priority}
                </AppText>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Recent Activities */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Recent Logs
      </AppText>
      <Card style={{ ...styles.listCard, marginBottom: spacing.xl }}>
        {dashboard?.recentActivities?.length === 0 ? (
          <AppText style={styles.emptyText}>No recent activity logged.</AppText>
        ) : (
          dashboard?.recentActivities?.map((activity: any) => (
            <View key={activity.id} style={styles.listItem}>
              <View style={styles.activityIcon}>
                <Feather
                  name={
                    activity.type === "Customer"
                      ? "user-plus"
                      : activity.type === "Purchase"
                      ? "shopping-cart"
                      : "phone-call"
                  }
                  size={16}
                  color={employeeColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <AppText weight="600" color={adminColors.text}>
                  {activity.title}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 1 }}>
                  {activity.description}
                </AppText>
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: spacing.sm,
    color: adminColors.text,
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionsContainer: {
    gap: spacing.xs,
  },
  chartCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...shadows.sm,
  },
  chartContainer: {
    flexDirection: "row",
    height: 180,
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  tooltip: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  chartBar: {
    width: "70%",
    maxWidth: 24,
    borderRadius: radius.sm,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: adminColors.textSecondary,
    marginTop: spacing.xs,
  },
  listCard: {
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...shadows.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    paddingVertical: spacing.lg,
    textAlign: "center",
    color: adminColors.textSecondary,
    width: "100%",
  },
});
