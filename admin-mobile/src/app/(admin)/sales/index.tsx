import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useCustomers, useCustomerPurchases, useSalesAreas, useIncentiveRules } from "@/features/sales/hooks/useSales";
import { parsePurchaseRemarks } from "@/features/sales/sales.utils";
import StatCard from "@/features/dashboard/components/StatCard";
import QuickActionCard from "@/features/dashboard/components/QuickActionCard";

export default function SalesDashboardScreen() {
  const router = useRouter();

  // Queries
  const { data: customers = [], isLoading: loadCust, isError: errCust, refetch: refetchCust } = useCustomers();
  const { data: purchases = [], isLoading: loadPur, isError: errPur, refetch: refetchPur } = useCustomerPurchases();
  const { data: salesAreas = [], isLoading: loadArea, isError: errArea, refetch: refetchArea } = useSalesAreas();
  const { data: rules = [], isLoading: loadRules, isError: errRules, refetch: refetchRules } = useIncentiveRules();

  const loading = loadCust || loadPur || loadArea || loadRules;
  const isError = errCust || errPur || errArea || errRules;

  const handleRefresh = async () => {
    await Promise.all([refetchCust(), refetchPur(), refetchArea(), refetchRules()]);
  };

  const todayStr = new Date().toISOString().substring(0, 10);

  // KPI Calculations
  const stats = useMemo(() => {
    const approvedPurchases = purchases.filter((p) => p.status === "Approved");
    const totalRev = approvedPurchases.reduce((sum, p) => sum + p.amount, 0);

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
        title="Sales Dashboard"
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

      {/* Quick Actions */}
      <AppText variant="h3" weight="700" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
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
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
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
