import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText } from "@/components/ui";
import { adminColors, employeeColors, useThemeColors, spacing, radius } from "@/theme";
import { useAdminExpenseSummary } from "@/features/expense/hooks/useAdminExpenseSummary";
import { useEmployeeExpenseSummary } from "@/features/expense/hooks/useEmployeeExpenseSummary";
import AdminExpenseMonthlyOverview from "@/features/expense/components/AdminExpenseMonthlyOverview";
import EmployeeExpenseMonthlyOverview from "@/features/expense/components/EmployeeExpenseMonthlyOverview";
import { formatCurrency } from "@/features/sales/sales.utils";

interface ExpenseOverviewSectionProps {
  mode?: "admin" | "employee";
  userId?: string;
  theme?: "admin" | "employee";
  showViewAll?: boolean;
}

export default function ExpenseOverviewSection({
  mode = "admin",
  theme,
  showViewAll = true,
}: ExpenseOverviewSectionProps) {
  const router = useRouter();
  const fallbackColors = useThemeColors();
  const colors = theme === "employee" ? employeeColors : theme === "admin" ? adminColors : fallbackColors;

  const isEmployee = mode === "employee";

  const {
    data: adminData,
    isLoading: isAdminLoading,
    isError: isAdminError,
  } = useAdminExpenseSummary();

  const {
    data: employeeData,
    isLoading: isEmployeeLoading,
    isError: isEmployeeError,
  } = useEmployeeExpenseSummary();

  const isLoading = isEmployee ? isEmployeeLoading : isAdminLoading;
  const isError = isEmployee ? isEmployeeError : isAdminError;

  const viewAllRoute = isEmployee ? "/(employee)/expenses" : "/(admin)/expenses";

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalExpenses = isEmployee
    ? (employeeData?.totalExpenses ?? 0)
    : (adminData?.totalCompanyExpense ?? 0);

  const monthlySummary = isEmployee
    ? (employeeData?.monthlySummary ?? [])
    : (adminData?.monthlySummary ?? []);

  const currentMonthData = monthlySummary.find((m) => m.month === currentMonthKey);
  const thisMonthExpenses = isEmployee
    ? (employeeData?.monthlyTotal ?? currentMonthData?.amount ?? 0)
    : (currentMonthData?.amount ?? 0);

  return (
    <View style={styles.wrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBg, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="credit-card" size={14} color={colors.primary} />
          </View>
          <AppText variant="h3" weight="700" color={colors.text}>
            Monthly Expense Overview
          </AppText>
        </View>

        {showViewAll && (
          <Pressable
            onPress={() => router.push(viewAllRoute as any)}
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
        )}
      </View>

      {/* Summary Pills */}
      <View style={styles.summaryRow}>
        <View style={[styles.pill, { backgroundColor: `${colors.primary}12` }]}>
          <View style={[styles.pillIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Feather name="credit-card" size={12} color={colors.primary} />
          </View>
          <View>
            <AppText variant="caption" color={colors.textSecondary} weight="500">
              {isEmployee ? "My Total Expenses" : "Total Expenses"}
            </AppText>
            <AppText variant="h3" weight="700" color={colors.text}>
              {formatCurrency(totalExpenses)}
            </AppText>
          </View>
        </View>

        <View style={[styles.pill, { backgroundColor: `${colors.success}12` }]}>
          <View style={[styles.pillIcon, { backgroundColor: `${colors.success}20` }]}>
            <Feather name="calendar" size={12} color={colors.success} />
          </View>
          <View>
            <AppText variant="caption" color={colors.textSecondary} weight="500">
              This Month
            </AppText>
            <AppText variant="h3" weight="700" color={colors.text}>
              {formatCurrency(thisMonthExpenses)}
            </AppText>
          </View>
        </View>
      </View>

      {/* Overview Chart / Component */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <AppText variant="caption" color={colors.textSecondary}>
            Unable to load expense overview.
          </AppText>
        </View>
      ) : isEmployee ? (
        <EmployeeExpenseMonthlyOverview monthlySummary={monthlySummary} />
      ) : (
        <AdminExpenseMonthlyOverview monthlySummary={monthlySummary} />
      )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
