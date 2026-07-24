import { View } from "react-native";

import { Screen, AppText } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";

import { useAdminExpenseSummary } from "@/features/expense/hooks/useAdminExpenseSummary";
import AdminExpenseSummaryCards from "@/features/expense/components/AdminExpenseSummaryCards";
import AdminExpenseMonthlyOverview from "@/features/expense/components/AdminExpenseMonthlyOverview";
import TopEmployeesList from "@/features/expense/components/TopEmployeesList";
import DepartmentSummaryList from "@/features/expense/components/DepartmentSummaryList";
import RecentActivityList from "@/features/expense/components/RecentActivityList";

export default function ExpenseTrackerScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminExpenseSummary();

  const isDataEmpty = !data || data.totalExpenseCount === 0;

  return (
    <Screen
      scroll={true}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : "Unable to load expense summary data."}
      onRetry={refetch}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <View style={{ gap: spacing.lg }}>
        <AppHeader
          title="Expense Tracker"
          subtitle="Organization expense overview"
        />

        {isDataEmpty ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xxl }}>
            <AppText variant="h3" weight="700">
              No Expense Data
            </AppText>
            <AppText variant="body" color="#64748B" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              There are no expense records found in the organization.
            </AppText>
          </View>
        ) : (
          <>
            {/* Summary cards (Total, Approved, Pending, Rejected) */}
            <AdminExpenseSummaryCards summary={data} />

            {/* Monthly comparison overview */}
            <AdminExpenseMonthlyOverview monthlySummary={data.monthlySummary} />

            {/* Top spending employees list */}
            <TopEmployeesList topEmployees={data.topEmployees} />

            {/* Department aggregation breakdowns */}
            <DepartmentSummaryList departmentSummary={data.departmentSummary} />

            {/* Recent claims activity list */}
            <RecentActivityList recentExpenses={data.recentExpenses} />
          </>
        )}
      </View>
    </Screen>
  );
}
