import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { AppText } from "@/components/ui";
import { adminColors, employeeColors, useThemeColors, spacing, radius } from "@/theme";
import MonthlyRevenueChart from "@/features/sales/components/MonthlyRevenueChart";
import { getCustomerPurchases } from "@/features/sales/customer-purchase.service";
import { getMyCustomerPurchases } from "@/features/sales/employee-sales.service";
import {
  getApprovedRevenue,
  getCurrentMonthRevenue,
  formatCurrency,
} from "@/features/sales/sales.utils";

interface SalesRevenueSectionProps {
  mode?: "admin" | "employee";
  userId?: string;
  theme?: "admin" | "employee";
}

export default function SalesRevenueSection({
  mode = "admin",
  userId,
  theme,
}: SalesRevenueSectionProps) {
  const router = useRouter();
  const fallbackColors = useThemeColors();
  const colors = theme === "employee" ? employeeColors : theme === "admin" ? adminColors : fallbackColors;

  const isEmployee = mode === "employee";

  const { data: adminPurchases = [], isLoading: isAdminLoading, isError: isAdminError } = useQuery({
    queryKey: ["sales", "purchases"],
    queryFn: getCustomerPurchases,
    enabled: !isEmployee,
  });

  const { data: employeePurchases = [], isLoading: isEmployeeLoading, isError: isEmployeeError } = useQuery({
    queryKey: ["my-purchases", userId],
    queryFn: () => getMyCustomerPurchases(userId || ""),
    enabled: isEmployee && !!userId,
  });

  const purchases = isEmployee ? employeePurchases : adminPurchases;
  const isLoading = isEmployee ? isEmployeeLoading : isAdminLoading;
  const isError = isEmployee ? isEmployeeError : isAdminError;

  const totalRevenue = getApprovedRevenue(purchases);
  const monthRevenue = getCurrentMonthRevenue(purchases);

  const viewAllRoute = isEmployee ? "/(employee)/sales" : "/(admin)/sales";

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBg, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="trending-up" size={14} color={colors.primary} />
          </View>
          <AppText variant="h3" weight="700" color={colors.text}>
            Sales Revenue
          </AppText>
        </View>

        <Pressable
          onPress={() => router.push(viewAllRoute)}
          android_ripple={{ color: "transparent" }}
          style={({ pressed }) => [
            styles.viewAllBtn,
            { backgroundColor: `${colors.primary}10`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <AppText variant="caption" weight="600" color={colors.primary}>
            View All
          </AppText>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View
          style={[
            styles.pill,
            { backgroundColor: `${colors.primary}12` },
          ]}
        >
          <View style={[styles.pillIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Feather name="dollar-sign" size={12} color={colors.primary} />
          </View>
          <View>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              weight="500"
            >
              Total Revenue
            </AppText>
            <AppText variant="h3" weight="700" color={colors.text}>
              {formatCurrency(totalRevenue)}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.pill,
            { backgroundColor: `${colors.success}12` },
          ]}
        >
          <View
            style={[
              styles.pillIcon,
              { backgroundColor: `${colors.success}20` },
            ]}
          >
            <Feather name="calendar" size={12} color={colors.success} />
          </View>
          <View>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              weight="500"
            >
              This Month
            </AppText>
            <AppText variant="h3" weight="700" color={colors.text}>
              {formatCurrency(monthRevenue)}
            </AppText>
          </View>
        </View>
      </View>

      <MonthlyRevenueChart
        purchases={purchases}
        isLoading={isLoading}
        isError={isError}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${adminColors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: `${adminColors.primary}10`,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
 
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${adminColors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
});
