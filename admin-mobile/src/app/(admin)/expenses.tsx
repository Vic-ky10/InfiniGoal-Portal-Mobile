/* eslint-disable react-hooks/set-state-in-effect */
import React, { useMemo, useState, useEffect } from "react";
import { View, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";
import { toast } from "@/store/toast.store";

import { useExpenses } from "@/features/expense/hooks/useExpenses";
import ExpenseCard from "@/features/expense/components/ExpenseCard";
import ExpenseFilterBar from "@/features/expense/components/ExpenseFilterBar";
import ExpenseCardSkeleton from "@/features/expense/components/ExpenseCardSkeleton";
import ExpenseEmptyState from "@/features/expense/components/ExpenseEmptyState";
import ExpenseDetailsModal from "@/features/expense/components/ExpenseDetailsModal";
import { ExpenseFilters, ExpenseWithEmployee } from "@/features/expense/expense.types";

export default function ExpensesScreen() {
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithEmployee | null>(null);

  const {
    expenses,
    loading,
    refreshing,
    refresh,
    handleReview,
    handleMarkPaid,
  } = useExpenses();

  const { expenseId } = useLocalSearchParams<{ expenseId?: string }>();

  useEffect(() => {
    if (expenseId && expenses.length > 0) {
      const expense = expenses.find((e) => e.id === expenseId);
      if (expense) {
        setSelectedExpense(expense);
      } else {
        toast.error("The requested expense claim could not be found.");
      }
    }
  }, [expenseId, expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Status filter
      if (filters.status && filters.status !== "All") {
        if (expense.status !== filters.status) return false;
      }

      // Category filter
      if (filters.category && filters.category !== "All") {
        if (expense.expense_type !== filters.category) return false;
      }

      // Receipt filter
      if (filters.hasReceipt !== undefined && filters.hasReceipt !== null) {
        const hasRec = Boolean(expense.receipt_url);
        if (hasRec !== filters.hasReceipt) return false;
      }

      // Date filter
      if (filters.date && expense.expense_date !== filters.date) return false;

      // Month filter
      if (filters.month && !expense.expense_date.startsWith(filters.month)) return false;

      // Year filter
      if (filters.year && !expense.expense_date.startsWith(filters.year)) return false;

      // Search Query (matches Title, Employee Name, Category, Description)
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const cat = expense.expense_type.toLowerCase();
        const empName = (expense.employee?.full_name || "").toLowerCase();
        const desc = (expense.description || "").toLowerCase();
        if (!cat.includes(q) && !empName.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  return (
    <Screen
      scroll={false}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Expense Claims" subtitle="Review & approve employee reimbursements" />

        {/* Enhanced Filter Bar */}
        <ExpenseFilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Expenses List or Skeleton */}
        {loading ? (
          <View style={{ gap: spacing.sm }}>
            <ExpenseCardSkeleton />
            <ExpenseCardSkeleton />
            <ExpenseCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={refresh}
            showsVerticalScrollIndicator={false}

            contentContainerStyle={{
              gap: spacing.md,
              paddingBottom: spacing.xl,
              flexGrow: filteredExpenses.length === 0 ? 1 : undefined,
            }}
            ListEmptyComponent={
              <ExpenseEmptyState
                title="No Expense Claims Found"
                message="No employee expense submissions match your filter criteria."
              />
            }
            renderItem={({ item }) => (
              <ExpenseCard
                expense={item}
                onReview={handleReview}
                onMarkPaid={handleMarkPaid}
                onPressDetails={(exp) => setSelectedExpense(exp)}
              />
            )}
          />
        )}

        {/* Expense Details Screen / Admin Review Panel Modal */}
        <ExpenseDetailsModal
          visible={Boolean(selectedExpense)}
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          isAdmin={true}
          onReview={handleReview}
          onMarkPaid={handleMarkPaid}
        />
      </View>
    </Screen>
  );
}