import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useCustomers, useCustomerPurchases, useSalesAreas, useIncentiveRules, useCustomerFollowups } from "@/features/sales/hooks/useSales";
import { useEmployees } from "@/features/employee/hooks/useEmployees";
import { parsePurchaseRemarks, getApprovedRevenue } from "@/features/sales/sales.utils";
import StatCard from "@/features/dashboard/components/StatCard";
import QuickActionCard from "@/features/dashboard/components/QuickActionCard";
import { MonthlyRevenueChart } from "@/features/sales/components";

export default function SalesDashboardScreen() {
  const router = useRouter();

  // Queries
  const { data: customers = [], isLoading: loadCust, isError: errCust, refetch: refetchCust } = useCustomers();
  const { data: purchases = [], isLoading: loadPur, isError: errPur, refetch: refetchPur } = useCustomerPurchases();
  const { data: salesAreas = [], isLoading: loadArea, isError: errArea, refetch: refetchArea } = useSalesAreas();
  const { data: rules = [], isLoading: loadRules, isError: errRules, refetch: refetchRules } = useIncentiveRules();
  const { data: followups = [], isLoading: loadFollow, isError: errFollow, refetch: refetchFollow } = useCustomerFollowups();
  const { employees, refresh: refreshEmployees } = useEmployees();

  const loading = loadCust || loadPur || loadArea || loadRules || loadFollow;
  const isError = errCust || errPur || errArea || errRules || errFollow;

  const handleRefresh = async () => {
    await Promise.all([refetchCust(), refetchPur(), refetchArea(), refetchRules(), refetchFollow(), refreshEmployees()]);
  };

  const todayStr = new Date().toISOString().substring(0, 10);

  // KPI Calculations
  const stats = useMemo(() => {
    const approvedPurchases = purchases.filter((p) => p.status === "Approved");
    const totalRev = getApprovedRevenue(purchases);

    const todayRev = approvedPurchases
      .filter((p) => p.purchase_date.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCustomers = customers.length;
    const totalPurchases = purchases.length;

    const totalIncentives = purchases
      .filter((p) => parsePurchaseRemarks(p.remarks, p.status).incentive_status === "Approved")
      .reduce((sum, p) => sum + p.incentive_amount, 0);

    const totalAreas = salesAreas.length;
    const activeRules = rules.filter((r) => r.status === "Active").length;

    return {
      totalRev,
      todayRev,
      totalCustomers,
      totalPurchases,
      totalIncentives,
      totalAreas,
      activeRules,
    };
  }, [purchases, customers, salesAreas, rules, todayStr]);

  // CRM Followup Calculations
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().substring(0, 10);

  const followupStats = useMemo(() => {
    let todayCount = 0;
    let tomorrowCount = 0;
    let overdueCount = 0;
    let completedTodayCount = 0;

    followups.forEach((f) => {
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
  }, [followups, todayStr, tomorrowStr]);

  // Next 5 upcoming followups
  const upcomingFollowups = useMemo(() => {
    return followups
      .filter((f) => f.next_followup_date && new Date(f.next_followup_date).getTime() >= new Date().getTime())
      .sort((a, b) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime())
      .slice(0, 5)
      .map((f) => {
        const cust = customers.find((c) => c.id === f.customer_id);
        const emp = cust ? employees.find((e) => e.id === cust.assigned_employee_id) : null;
        
        const now = new Date().getTime();
        const daysLeft = Math.ceil((new Date(f.next_followup_date!).getTime() - now) / (1000 * 60 * 60 * 24));
        const priority = daysLeft <= 2 ? "High" : daysLeft <= 5 ? "Medium" : "Low";

        return {
          ...f,
          customerName: cust?.full_name || "Unknown Customer",
          employeeName: emp?.full_name || "Unassigned",
          priority,
        };
      });
  }, [followups, customers, employees]);

  // Recent lists
  const recentPurchases = useMemo(() => {
    return purchases.slice(0, 3).map((p) => {
      const cust = customers.find((c) => c.id === p.customer_id);
      return { ...p, customerName: cust?.full_name || "Unknown Customer" };
    });
  }, [purchases, customers]);

  const recentCustomers = useMemo(() => {
    return customers.slice(0, 3).map((c) => {
      const area = salesAreas.find((a) => a.id === c.sales_area_id);
      return { ...c, areaName: area?.area_name || "Unknown Area" };
    });
  }, [customers, salesAreas]);

  return (
    <Screen
      isLoading={loading}
      isError={isError}
      errorMessage="Unable to load sales dashboard. Please check connection."
      onRetry={handleRefresh}
      onRefresh={handleRefresh}
      refreshing={loading}
    >
      <AppHeader
        title={`Sales Dashboard ${followupStats.pendingCount > 0 ? `🔔 ${followupStats.pendingCount}` : ""}`}
        subtitle="Incentives, customer directory & metrics"
        onBack={() => router.replace("/(admin)/dashboard")}
      />

      <AppText variant="h3" weight="700" style={styles.sectionTitle}>
        Financials & Rules
      </AppText>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRev.toLocaleString("en-IN")}`}
            icon="dollar-sign"
            color={adminColors.primary}
          />
          <StatCard
            title="Today's Revenue"
            value={`₹${stats.todayRev.toLocaleString("en-IN")}`}
            icon="trending-up"
            color={adminColors.success}
          />
        </View>

        <View style={styles.row}>
          <StatCard
            title="Paid Incentives"
            value={`₹${stats.totalIncentives.toLocaleString("en-IN")}`}
            icon="award"
            color={adminColors.warning}
          />
          <StatCard
            title="Active Rules"
            value={stats.activeRules.toString()}
            icon="bar-chart-2"
            color={adminColors.info}
          />
        </View>

        <View style={styles.row}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toString()}
            icon="users"
            color={adminColors.secondary}
          />
          <StatCard
            title="Sales Areas"
            value={stats.totalAreas.toString()}
            icon="map-pin"
            color={adminColors.danger}
          />
        </View>
      </View>

      {/* CRM Followups Overview Grid */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
        CRM Follow-up Overview
      </AppText>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            title="Today's Follow-ups"
            value={followupStats.todayCount.toString()}
            icon="phone"
            color={adminColors.primary}
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

      {/* Next 5 Upcoming Follow-ups Widget */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <AppText variant="h3" weight="700">
          Upcoming Follow-ups (CRM)
        </AppText>
        <TouchableOpacity onPress={() => router.push("/(admin)/sales/customers")}>
          <AppText variant="caption" color={adminColors.primary} weight="600">
            Log CRM
          </AppText>
        </TouchableOpacity>
      </View>
      <View style={styles.listCard}>
        {upcomingFollowups.length === 0 ? (
          <AppText style={styles.emptyText}>No upcoming follow-ups scheduled.</AppText>
        ) : (
          upcomingFollowups.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() => {
                router.push({
                  pathname: "/(admin)/sales/customers",
                  params: { customerId: item.customer_id, followupId: item.id },
                });
              }}
            >
              <View style={{ flex: 1 }}>
                <AppText weight="700" color={adminColors.text}>
                  {item.customerName}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                  Type: {item.followup_type} • Rep: {item.employeeName}
                </AppText>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <AppText variant="caption" weight="700" color={adminColors.primary}>
                  {new Date(item.next_followup_date!).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </AppText>
                <Badge
                  label={item.priority}
                  color={item.priority === "High" ? adminColors.danger : item.priority === "Medium" ? adminColors.warning : adminColors.success}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Monthly Revenue Chart */}
      <View style={{ marginTop: spacing.xl }}>
        <MonthlyRevenueChart
          purchases={purchases}
          isLoading={loadPur}
          isError={errPur}
          theme="admin"
        />
      </View>

      {/* Quick Actions */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
        Quick Actions
      </AppText>
      <View style={styles.actionsContainer}>
        <QuickActionCard
          title="Customer Directory"
          subtitle="Manage buyer accounts & details"
          icon="users"
          onPress={() => router.push("/(admin)/sales/customers")}
        />
        <QuickActionCard
          title="My Follow-Ups"
          subtitle="View and manage scheduled actions & logs"
          icon="phone"
          onPress={() => router.push("/(admin)/sales/followups")}
        />
        <QuickActionCard
          title="Purchase History"
          subtitle="Record new invoice sales & status"
          icon="shopping-cart"
          onPress={() => router.push("/(admin)/sales/purchases")}
        />
        <QuickActionCard
          title="Sales Areas"
          subtitle="Define regions & client zones"
          icon="map-pin"
          onPress={() => router.push("/(admin)/sales/areas")}
        />
        <QuickActionCard
          title="Incentive Rules"
          subtitle="Establish active commission targets"
          icon="award"
          onPress={() => router.push("/(admin)/sales/rules")}
        />
      </View>

      {/* Recent Purchases List */}
      <View style={styles.sectionHeaderRow}>
        <AppText variant="h3" weight="700">
          Recent Purchases
        </AppText>
        <TouchableOpacity onPress={() => router.push("/(admin)/sales/purchases")}>
          <AppText variant="caption" color={adminColors.primary} weight="600">
            View All
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {recentPurchases.length === 0 ? (
          <AppText style={styles.emptyText}>No recent purchases logged.</AppText>
        ) : (
          recentPurchases.map((purchase) => (
            <View key={purchase.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <AppText weight="700" color={adminColors.text}>
                  {purchase.customerName}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                  Code: {purchase.purchase_code} • {purchase.purchase_date}
                </AppText>
              </View>
              <AppText weight="700" color={adminColors.primary}>
                ₹{purchase.amount.toLocaleString("en-IN")}
              </AppText>
            </View>
          ))
        )}
      </View>

      {/* Recent Customers List */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <AppText variant="h3" weight="700">
          Recent Customers
        </AppText>
        <TouchableOpacity onPress={() => router.push("/(admin)/sales/customers")}>
          <AppText variant="caption" color={adminColors.primary} weight="600">
            View All
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={[styles.listCard, { marginBottom: spacing.xl }]}>
        {recentCustomers.length === 0 ? (
          <AppText style={styles.emptyText}>No customer accounts found.</AppText>
        ) : (
          recentCustomers.map((c) => (
            <View key={c.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <AppText weight="700" color={adminColors.text}>
                  {c.full_name}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                  {c.phone} • {c.areaName}
                </AppText>
              </View>
              <Feather name="chevron-right" size={16} color={adminColors.textSecondary} />
            </View>
          ))
        )}
      </View>
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  listCard: {
    backgroundColor: adminColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: spacing.md,
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
  emptyText: {
    paddingVertical: spacing.lg,
    textAlign: "center",
    color: adminColors.textSecondary,
  },
});
