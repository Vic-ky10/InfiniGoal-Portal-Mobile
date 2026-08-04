import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";

import { useEmployeeExpenseSummary } from "@/features/expense/hooks/useEmployeeExpenseSummary";
import EmployeeExpenseSummaryCards from "@/features/expense/components/EmployeeExpenseSummaryCards";
import EmployeeExpenseMonthlyOverview from "@/features/expense/components/EmployeeExpenseMonthlyOverview";
import EmployeeCategorySummary from "@/features/expense/components/EmployeeCategorySummary";
import EmployeeRecentExpenseList from "@/features/expense/components/EmployeeRecentExpenseList";
import ExpenseEmptyState from "@/features/expense/components/ExpenseEmptyState";
import ExpenseDetailsModal from "@/features/expense/components/ExpenseDetailsModal";
import { Expense } from "@/features/expense/expense.types";

export default function EmployeeExpenseTrackerScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useEmployeeExpenseSummary();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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
          <ExpenseEmptyState
            onCreatePress={() => router.push("/(employee)/expenses")}
            title="No Expense Data Yet"
            message="You have not submitted any expense claims yet. Create your first claim now."
          />
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

      <ExpenseDetailsModal
        visible={Boolean(selectedExpense)}
        expense={selectedExpense ? { ...selectedExpense, employee: null } : null}
        onClose={() => setSelectedExpense(null)}
      />
    </Screen>
  );
}
