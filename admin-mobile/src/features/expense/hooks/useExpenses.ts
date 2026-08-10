import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  ExpenseFilters,
  ExpenseWithEmployee,
  ExpenseStatus,
} from "../expense.types";
import {
  getAuthenticatedProfileId,
  getExpenses,
  markExpensePaid,
  reviewExpense,
} from "../expense.service";

export function useExpenses(initialFilters: ExpenseFilters = {}) {
  const [expenses, setExpenses] = useState<ExpenseWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [channelName] = useState(() => `expenses-hook-${Math.random().toString(36).substring(2, 9)}`);

  const fetchExpenses = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getExpenses();
      setExpenses(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          fetchExpenses(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExpenses, channelName]);

  const handleReview = async (
    expenseId: string,
    status: ExpenseStatus,
    approvedAmount: number,
    comment?: string
  ) => {
    const profileId = await getAuthenticatedProfileId();
    if (!profileId) {
      return { success: false, error: "Authenticated profile not found." };
    }

    const result = await reviewExpense(profileId, {
      expenseId,
      status: status as "Approved" | "Rejected",
      approved_amount: approvedAmount,
      review_comment: comment,
    });

    if (result.success) {
      fetchExpenses(true);
    }

    return result;
  };

  const handleMarkPaid = async (expenseId: string) => {
    const result = await markExpensePaid(expenseId);
    if (result.success) {
      fetchExpenses(true);
    }
    return result;
  };

  return {
    expenses,
    loading,
    refreshing,
    
    
    refresh: () => fetchExpenses(true),
    handleReview,
    handleMarkPaid,
  };
}
