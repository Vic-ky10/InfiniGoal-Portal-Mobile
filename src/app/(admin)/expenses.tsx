import { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useExpenses } from "@/features/expense/hooks/useExpenses";
import ExpenseCard from "@/features/expense/components/ExpenseCard";
import { ExpenseStatus } from "@/features/expense/expense.types";

const STATUS_FILTERS: { label: string; value: ExpenseStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

export default function ExpensesScreen() {
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "">("");
  const { expenses, loading, refreshing, refresh, handleReview, handleMarkPaid } = useExpenses({
    status: statusFilter || undefined,
  });

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Expense Claims" subtitle="Review & approve employee reimbursements" />

        {/* Status Filters */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
          {STATUS_FILTERS.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setStatusFilter(opt.value)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? adminColors.primary : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? adminColors.primary : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Expenses List */}
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: expenses.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No expense claims found." />}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onReview={handleReview}
              onMarkPaid={handleMarkPaid}
            />
          )}
        />
      </View>
    </Screen>
  );
}