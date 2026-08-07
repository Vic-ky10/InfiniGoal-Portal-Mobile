/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Input, Button, DatePickerField } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/store/toast.store";

import { Expense, ExpenseFilters, EXPENSE_CATEGORY } from "@/features/expense/expense.types";
import {
  getEmployeeExpenses,
  createExpense,
  updateExpense,
} from "@/features/expense/expense.service";
import ExpenseCard from "@/features/expense/components/ExpenseCard";
import ReceiptUploader from "@/features/expense/components/ReceiptUploader";
import ExpenseDetailsModal from "@/features/expense/components/ExpenseDetailsModal";
import ExpenseFilterBar from "@/features/expense/components/ExpenseFilterBar";
import ExpenseCardSkeleton from "@/features/expense/components/ExpenseCardSkeleton";
import ExpenseEmptyState from "@/features/expense/components/ExpenseEmptyState";
import { useLocalSearchParams } from "expo-router";

export default function EmployeeExpensesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [detailsExpense, setDetailsExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Filters state
  const [filters, setFilters] = useState<ExpenseFilters>({});

  const { expenseId } = useLocalSearchParams<{ expenseId?: string }>();

  useEffect(() => {
    if (expenseId && expenses.length > 0) {
      const expense = expenses.find((e) => e.id === expenseId);
      if (expense) {
        setDetailsExpense(expense);
      } else {
        toast.error("The requested expense claim could not be found.");
      }
    }
  }, [expenseId, expenses]);

  // Form State
  const [expenseType, setExpenseType] = useState<string>(EXPENSE_CATEGORY.PETROL);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  // Receipt Metadata State
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptSize, setReceiptSize] = useState<number | null>(null);
  const [receiptType, setReceiptType] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfileId(user.id);
      const data = await getEmployeeExpenses(user.id);
      setExpenses(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });

    if (!profileId) return;

    const channel = supabase
      .channel("employee-expenses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload: { new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          const affectedProfileId = (newRow?.profile_id || oldRow?.profile_id) as string | undefined;

          if (affectedProfileId === profileId) {
            loadData(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, profileId]);

  const resetForm = () => {
    setEditingExpense(null);
    setExpenseType(EXPENSE_CATEGORY.PETROL);
    setAmount("");
    setDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setReceiptUrl(null);
    setReceiptName(null);
    setReceiptSize(null);
    setReceiptType(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseType(expense.expense_type);
    setAmount(expense.amount.toString());
    setDescription(expense.description || "");
    setExpenseDate(expense.expense_date);
    setReceiptUrl(expense.receipt_url || null);
    setReceiptName(expense.receipt_name || null);
    setReceiptSize(expense.receipt_size || null);
    setReceiptType(expense.receipt_type || null);
    setModalVisible(true);
  };

  const handleSaveExpense = async () => {
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!expenseDate.trim()) {
      toast.error("Please select an expense date.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, profileId || "", {
          expense_type: expenseType as any,
          amount: Number(amount),
          expense_date: expenseDate,
          description: description.trim() || undefined,
          receipt_url: receiptUrl ?? null,
          receipt_name: receiptName ?? null,
          receipt_size: receiptSize ?? null,
          receipt_type: receiptType ?? null,
          uploaded_at: receiptUrl ? new Date().toISOString() : null,
        });
        if (res.success) {
          toast.success(res.message || "Expense updated successfully.");
          setModalVisible(false);
          loadData(true);
        } else {
          toast.error(res.error || "Failed to update expense.");
        }
      } else {
        if (!profileId) return;
        const res = await createExpense(profileId, {
          expense_type: expenseType as any,
          amount: Number(amount),
          expense_date: expenseDate,
          description: description.trim(),
          receipt_url: receiptUrl ?? null,
          receipt_name: receiptName ?? null,
          receipt_size: receiptSize ?? null,
          receipt_type: receiptType ?? null,
          uploaded_at: receiptUrl ? new Date().toISOString() : null,
        });
        if (res.success) {
          toast.success(res.message || "Expense claim submitted successfully.");
          setModalVisible(false);
          loadData(true);
        } else {
          toast.error(res.error || "Failed to submit expense.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Status filter
      if (filters.status && filters.status !== "All") {
        if (e.status.toUpperCase() !== filters.status.toUpperCase()) return false;
      }

      // Category filter
      if (filters.category && filters.category !== "All") {
        if (e.expense_type !== filters.category) return false;
      }

      // Has receipt filter
      if (filters.hasReceipt !== undefined && filters.hasReceipt !== null) {
        const hasRec = Boolean(e.receipt_url);
        if (hasRec !== filters.hasReceipt) return false;
      }

      // Date filter
      if (filters.date && e.expense_date !== filters.date) return false;

      // Month filter
      if (filters.month && !e.expense_date.startsWith(filters.month)) return false;

      // Year filter
      if (filters.year && !e.expense_date.startsWith(filters.year)) return false;

      // Search Query (title, category, description)
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const cat = e.expense_type.toLowerCase();
        const desc = (e.description || "").toLowerCase();
        const date = e.expense_date.toLowerCase();
        if (!cat.includes(q) && !desc.includes(q) && !date.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <ExpenseCard
      expense={{ ...item, employee: null }}
      showAvatar={false}
      showActions={false}
      onEdit={item.status === "Pending" ? () => openEditModal(item) : undefined}
      onPressDetails={() => setDetailsExpense(item)}
    />
  );

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Expense Claims"
          subtitle="Submit and track your expense reimbursements"
          rightComponent={
            <TouchableOpacity
              onPress={openCreateModal}
              style={{
                backgroundColor: employeeColors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
              }}
            >
              <AppText weight="700" color="#FFFFFF">
                + Claim
              </AppText>
            </TouchableOpacity>
          }
        />

        {/* Enhanced Filter Bar */}
        <ExpenseFilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Expense List or Skeleton */}
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
            renderItem={renderExpenseItem}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ExpenseEmptyState
                onCreatePress={openCreateModal}
                title="No Expenses Found"
                message="Submit your first expense claim to start tracking reimbursements."
              />
            }
            contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          />
        )}

        {/* Create / Edit Expense Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: "90%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                <AppText variant="h2" weight="700">
                  {editingExpense ? "Edit Pending Expense" : "New Expense Claim"}
                </AppText>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                  <Feather name="x" size={22} color={employeeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll} contentContainerStyle={[styles.form, { flexGrow: 1, paddingBottom: spacing.xxxl }]}>
                <AppText weight="600" style={{ marginBottom: spacing.xs, fontSize: 13 }} color={employeeColors.textSecondary}>
                  Expense Category
                </AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md }}>
                  {Object.values(EXPENSE_CATEGORY).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setExpenseType(cat)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: expenseType === cat ? employeeColors.primary : employeeColors.border,
                        backgroundColor: expenseType === cat ? `${employeeColors.primary}10` : "#FFFFFF",
                      }}
                    >
                      <AppText weight={expenseType === cat ? "700" : "500"} color={expenseType === cat ? employeeColors.primary : employeeColors.text}>
                        {cat}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Amount (₹)"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                />

                <DatePickerField
                  label="Expense Date"
                  value={expenseDate}
                  onChange={setExpenseDate}
                  placeholder="YYYY-MM-DD"
                />

                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Expense details / reason..."
                  multiline
                  numberOfLines={3}
                  style={{ height: 75, textAlignVertical: "top" }}
                />

                {/* Receipt Uploader */}
                <ReceiptUploader
                  employeeId={profileId || ""}
                  expenseId={editingExpense?.id}
                  receiptUrl={receiptUrl}
                  receiptName={receiptName}
                  receiptType={receiptType}
                  onReceiptChanged={(info) => {
                    setReceiptUrl(info.url);
                    setReceiptName(info.name);
                    setReceiptSize(info.size);
                    setReceiptType(info.type);
                  }}
                />

                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title={editingExpense ? "Update Expense" : "Submit Claim"}
                    loading={submitting}
                    onPress={handleSaveExpense}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Expense Details Screen / Modal */}
        <ExpenseDetailsModal
          visible={Boolean(detailsExpense)}
          expense={detailsExpense ? { ...detailsExpense, employee: null } : null}
          onClose={() => setDetailsExpense(null)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    flexShrink: 1,
  },
  form: {
    gap: spacing.sm,
  },
});
