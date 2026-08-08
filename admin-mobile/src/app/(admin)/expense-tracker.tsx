/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { useExpenses } from "@/features/expense/hooks/useExpenses";
import { getAllCashOuts, ExpenseCashOut } from "@/features/expense/expense.service";
import AdminExpenseAnalyticsSection from "@/features/expense/components/AdminExpenseAnalyticsSection";
import ExpenseEmptyState from "@/features/expense/components/ExpenseEmptyState";
import StatCard from "@/features/dashboard/components/StatCard";

export default function ExpenseTrackerScreen() {
  const router = useRouter();
  const { expenses, loading, refreshing, refresh } = useExpenses();
  const [cashOuts, setCashOuts] = useState<ExpenseCashOut[]>([]);

  const loadCashOuts = async () => {
    try {
      const co = await getAllCashOuts();
      setCashOuts(co);
    } catch (e) {
      console.error("Error fetching cash outs on admin mobile:", e);
    }
  };

  useEffect(() => {
    loadCashOuts();

    const cashOutsChannel = supabase
      .channel("expense-tracker-adm")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_cash_outs" },
        () => {
          loadCashOuts();
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          loadCashOuts();
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cashOutsChannel);
    };
  }, [refresh]);

  const handleRefresh = () => {
    loadCashOuts();
    refresh();
  };

  const isDataEmpty = !expenses || expenses.length === 0;


  const now = new Date();
  const formatMonthKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const currentMonthKey = formatMonthKey(now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = formatMonthKey(prevMonthDate);

  const currentMonthSpend = expenses
    .filter((e) => e.expense_date && e.expense_date.startsWith(currentMonthKey))
    .reduce((sum, e) => sum + e.amount, 0);

  const prevMonthSpend = expenses
    .filter((e) => e.expense_date && e.expense_date.startsWith(prevMonthKey))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Screen
      scroll={true}
      isLoading={loading}
      onRetry={handleRefresh}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View style={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
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
            {/* top Overview Cards */}
            <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
              <StatCard
                title="Current Month Spending"
                value={`₹${currentMonthSpend.toLocaleString("en-IN")}`}
                icon="credit-card"
                color="#3B82F6"
                theme="admin"
              />
              <StatCard
                title="Previous Month Spending"
                value={`₹${prevMonthSpend.toLocaleString("en-IN")}`}
                icon="credit-card"
                color="#6366F1"
                theme="admin"
              />
            </View>

            {/* Admin Analytics Sections */}
            <AdminExpenseAnalyticsSection expenses={expenses} cashOuts={cashOuts} />
          </>
        )}
      </View>
    </Screen>
  );
}
