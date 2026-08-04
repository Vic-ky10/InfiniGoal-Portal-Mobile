import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";

import { useAdminExpenseSummary } from "@/features/expense/hooks/useAdminExpenseSummary";
import AdminExpenseSummaryCards from "@/features/expense/components/AdminExpenseSummaryCards";
import AdminExpenseMonthlyOverview from "@/features/expense/components/AdminExpenseMonthlyOverview";
import TopEmployeesList from "@/features/expense/components/TopEmployeesList";
import DepartmentSummaryList from "@/features/expense/components/DepartmentSummaryList";
import RecentActivityList from "@/features/expense/components/RecentActivityList";
import ExpenseEmptyState from "@/features/expense/components/ExpenseEmptyState";
import ExpenseDetailsModal from "@/features/expense/components/ExpenseDetailsModal";
import { ExpenseWithEmployee } from "@/features/expense/expense.types";

export default function ExpenseTrackerScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminExpenseSummary();
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithEmployee | null>(null);

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
          <ExpenseEmptyState
            onCreatePress={() => router.push("/(admin)/expenses")}
            title="No Organization Expense Data"
            message="There are no expense records found in the organization."
          />
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

      <ExpenseDetailsModal
        visible={Boolean(selectedExpense)}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        isAdmin={true}
      />
    </Screen>
  );
}
