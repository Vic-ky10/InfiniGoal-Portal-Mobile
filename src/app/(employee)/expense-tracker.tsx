import { View } from "react-native";

import { Screen, AppText } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";

import { useEmployeeExpenseSummary } from "@/features/expense/hooks/useEmployeeExpenseSummary";
import EmployeeExpenseSummaryCards from "@/features/expense/components/EmployeeExpenseSummaryCards";
import EmployeeExpenseMonthlyOverview from "@/features/expense/components/EmployeeExpenseMonthlyOverview";
import EmployeeCategorySummary from "@/features/expense/components/EmployeeCategorySummary";
import EmployeeRecentExpenseList from "@/features/expense/components/EmployeeRecentExpenseList";

export default function EmployeeExpenseTrackerScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useEmployeeExpenseSummary();

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
          subtitle="Track your personal expense activity"
        />

        {isDataEmpty ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xxl }}>
            <AppText variant="h3" weight="700">
              No Expense Data
            </AppText>
            <AppText variant="body" color="#64748B" style={{ marginTop: spacing.sm, textAlign: "center" }}>
              You have not submitted any expense claims yet.
            </AppText>
          </View>
        ) : (
          <>
            {/* Personal Summary Cards */}
            <EmployeeExpenseSummaryCards summary={data} />

            {/* Monthly spending comparison chart */}
            <EmployeeExpenseMonthlyOverview monthlySummary={data.monthlySummary} />

            {/* Category breakdown summary list */}
            <EmployeeCategorySummary
              categorySummary={data.categorySummary}
              totalExpenses={data.totalExpenses}
            />

            {/* Recent personal claims list */}
            <EmployeeRecentExpenseList recentExpenses={data.recentExpenses} />
          </>
        )}
      </View>
    </Screen>
  );
}
