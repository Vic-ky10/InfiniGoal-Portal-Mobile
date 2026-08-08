/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { getEmployeeExpenses, getEmployeeCashOuts, ExpenseCashOut } from "@/features/expense/expense.service";
import EmployeeWalletSection from "@/features/expense/components/EmployeeWalletSection";
import { Expense } from "@/features/expense/expense.types";
import StatCard from "@/features/dashboard/components/StatCard";

export default function EmployeeExpenseTrackerScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashOuts, setCashOuts] = useState<ExpenseCashOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getEmployeeExpenses(user.id);
      setExpenses(data);
      const co = await getEmployeeCashOuts(user.id);
      setCashOuts(co);
    } catch (err) {
      console.error("Error loading tracker expenses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("expense-tracker-emp")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_cash_outs" },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate overview spending metrics
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
      onRetry={loadData}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View style={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <AppHeader
          title="Expense Tracker"
          subtitle="Track your personal expense activity"
        />

        {/* Overview cards from Dashboard StatCard */}
        <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
          <StatCard
            title="Current Month Spending"
            value={`₹${currentMonthSpend.toLocaleString("en-IN")}`}
            icon="credit-card"
            color="#3B82F6"
            theme="employee"
          />
          <StatCard
            title="Previous Month Spending"
            value={`₹${prevMonthSpend.toLocaleString("en-IN")}`}
            icon="credit-card"
            color="#6366F1"
            theme="employee"
          />
        </View>

        {/* Wallet Section and Analytics breakdowns */}
        <EmployeeWalletSection expenses={expenses} cashOuts={cashOuts} onCashOutCreated={loadData} />
      </View>
    </Screen>
  );
}
