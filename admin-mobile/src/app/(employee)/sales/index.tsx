import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useEmployeeSalesDashboardData, useMyCustomerPurchases, useMyCustomers } from "@/features/sales/hooks/useEmployeeSales";
import { useCustomerFollowups } from "@/features/sales/hooks/useSales";
import { MonthlyRevenueChart } from "@/features/sales/components";
import StatCard from "@/features/dashboard/components/StatCard";
import QuickActionCard from "@/features/dashboard/components/QuickActionCard";
import { CustomerFollowup } from "@/features/sales/sales.types";

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

  const employeeColor = "#22C55E"; // Green accent for employee portal

  const { data: purchases = [], isLoading: isPurchasesLoading } = useMyCustomerPurchases(user?.id || "");
  const { data: customers = [] } = useMyCustomers(user?.id || "");
  const { data: followups = [], refetch: refetchFollowups } = useCustomerFollowups();

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchFollowups()]);
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().substring(0, 10);

  // CRM Followup Calculations (Filtered by employee's own actions if not already scoped by RLS)
  const myFollowups = useMemo(() => {
    return followups.filter((f: CustomerFollowup) => f.created_by === user?.id);
  }, [followups, user]);

  const followupStats = useMemo(() => {
    let todayCount = 0;
    let tomorrowCount = 0;
    let overdueCount = 0;
    let completedTodayCount = 0;

    myFollowups.forEach((f: CustomerFollowup) => {
      if (!f.next_followup_date) {
        if (f.followup_date && f.followup_date.startsWith(todayStr)) {
          completedTodayCount++;
        }
      } else {
        const nextStr = new Date(f.next_followup_date).toISOString().substring(0, 10);
        if (nextStr === todayStr) {
          todayCount++;
        } else if (nextStr === tomorrowStr) {
          tomorrowCount++;
        } else if (nextStr < todayStr) {
          overdueCount++;
        }
      }
    });

    return {
      todayCount,
      tomorrowCount,
      overdueCount,
      completedTodayCount,
      pendingCount: todayCount + tomorrowCount + overdueCount,
    };
  }, [myFollowups, todayStr, tomorrowStr]);

  // Next 5 upcoming followups
  const upcomingFollowups = useMemo(() => {
    return myFollowups
      .filter((f: CustomerFollowup) => f.next_followup_date && new Date(f.next_followup_date).getTime() >= new Date().getTime())
      .sort((a: CustomerFollowup, b: CustomerFollowup) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime())
      .slice(0, 5)
      .map((f: CustomerFollowup) => {
        const cust = customers.find((c) => c.id === f.customer_id);
        
        const now = new Date().getTime();
        const daysLeft = Math.ceil((new Date(f.next_followup_date!).getTime() - now) / (1000 * 60 * 60 * 24));
        const priority = daysLeft <= 2 ? "High" : daysLeft <= 5 ? "Medium" : "Low";

        return {
          ...f,
          customerName: cust?.full_name || "Unknown Customer",
          priority,
        };
      });
  }, [myFollowups, customers]);

  return (
    <Screen
      isLoading={isLoading || isPurchasesLoading}
      isError={isError}
      errorMessage="Unable to load your sales metrics. Please try again."
      onRetry={handleRefresh}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
    >
      <AppHeader
        title={`My Sales Portal ${followupStats.pendingCount > 0 ? `🔔 ${followupStats.pendingCount}` : ""}`}
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
          title="My Follow-Ups"
          subtitle="View and manage scheduled actions & logs"
          icon="phone"
          onPress={() => router.push("/(employee)/sales/followups")}
        />
        <QuickActionCard
          title="Record New Invoices"
          subtitle="Log purchases and review incentive payout status"
          icon="shopping-cart"
          onPress={() => router.push("/(employee)/sales/purchases")}
        />
      </View>

      {/* Revenue Trend Chart */}
      <View style={{ marginTop: spacing.lg }}>
        <MonthlyRevenueChart
          purchases={purchases}
          isLoading={isLoading || isPurchasesLoading}
          isError={isError}
          theme="employee"
        />
      </View>

      {/* CRM Followups Overview Grid */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        CRM Follow-up Overview
      </AppText>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            title="Today's Follow-ups"
            value={followupStats.todayCount.toString()}
            icon="phone"
            color={employeeColor}
          />
          <StatCard
            title="Tomorrow's Follow-ups"
            value={followupStats.tomorrowCount.toString()}
            icon="calendar"
            color={adminColors.info}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            title="Overdue Follow-ups"
            value={followupStats.overdueCount.toString()}
            icon="alert-circle"
            color={adminColors.danger}
          />
          <StatCard
            title="Completed Today"
            value={followupStats.completedTodayCount.toString()}
            icon="check-circle"
            color={adminColors.success}
          />
        </View>
      </View>

      {/* Upcoming Followups */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Upcoming Follow-ups (CRM)
      </AppText>
      <Card style={styles.listCard}>
        {upcomingFollowups.length === 0 ? (
          <AppText style={styles.emptyText}>No upcoming follow-ups scheduled.</AppText>
        ) : (
          upcomingFollowups.map((followup: any) => (
            <TouchableOpacity
              key={followup.id}
              style={styles.listItem}
              onPress={() => {
                router.push({
                  pathname: "/(employee)/sales/customers",
                  params: { customerId: followup.customer_id, followupId: followup.id },
                });
              }}
            >
              <View style={{ flex: 1 }}>
                <AppText weight="700" color={adminColors.text}>
                  {followup.customerName}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                  Type: {followup.followup_type} • Date: {new Date(followup.next_followup_date!).toLocaleDateString("en-IN")}
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
            </TouchableOpacity>
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
