import { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge, Input, Button, DatePickerField } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { Expense, EXPENSE_CATEGORY, EXPENSE_STATUS } from "@/features/expense/expense.types";
import {
  getEmployeeExpenses,
  createExpense,
  updateExpense,
} from "@/features/expense/expense.service";

export default function EmployeeExpensesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Form State
  const [expenseType, setExpenseType] = useState<string>(EXPENSE_CATEGORY.PETROL);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setExpenseType(EXPENSE_CATEGORY.PETROL);
    setAmount("");
    setDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setModalVisible(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseType(expense.expense_type);
    setAmount(expense.amount.toString());
    setDescription(expense.description || "");
    setExpenseDate(expense.expense_date);
    setModalVisible(true);
  };

  const handleSaveExpense = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }
    if (!expenseDate.trim()) {
      Alert.alert("Validation", "Please enter an expense date.");
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
        });
        if (res.success) {
          Alert.alert("Success", res.message);
          setModalVisible(false);
          loadData(true);
        } else {
          Alert.alert("Error", res.error);
        }
      } else {
        if (!profileId) return;
        const res = await createExpense(profileId, {
          expense_type: expenseType as any,
          amount: Number(amount),
          expense_date: expenseDate,
          description: description.trim(),
        });
        if (res.success) {
          Alert.alert("Success", res.message);
          setModalVisible(false);
          loadData(true);
        } else {
          Alert.alert("Error", res.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (selectedStatus === "ALL") return true;
    return e.status.toUpperCase() === selectedStatus;
  });

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <Card style={{ marginBottom: spacing.md, borderWidth: 1, borderColor: employeeColors.border, ...shadows.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppText weight="700" variant="h3" color={employeeColors.text}>
              ₹{item.amount.toLocaleString()}
            </AppText>
            <Badge
              label={item.status}
              color={
                item.status === "Approved"
                  ? employeeColors.primary
                  : item.status === "Pending"
                  ? employeeColors.warning
                  : employeeColors.danger
              }
            />
          </View>
          <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: spacing.xs }}>
            Code: {item.expense_code} | Category: {item.expense_type} | Date: {item.expense_date}
          </AppText>
          {item.description ? (
            <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.sm }}>
             Reason:   {item.description}
            </AppText>
          ) : null}
          {item.review_comment && (
            <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: spacing.xs, fontStyle: "italic" }}>
              Manager Note: {item.review_comment}
            </AppText>
          )}
        </View>

        {item.status === "Pending" && (
          <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: spacing.xs, backgroundColor: `${employeeColors.primary}10`, borderRadius: radius.sm }}>
            <Feather name="edit-2" size={14} color={employeeColors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <Screen isLoading={loading} scroll={false}>
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

        {/* Filter Pills */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setSelectedStatus(status)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                backgroundColor: selectedStatus === status ? employeeColors.primary : `${employeeColors.primary}10`,
              }}
            >
              <AppText variant="caption" weight="600" color={selectedStatus === status ? "#FFFFFF" : employeeColors.primary}>
                {status}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Expense Claims Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />

        {/* Create / Edit Expense Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "85%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
                <AppText variant="h2" weight="700">
                  {editingExpense ? "Edit Pending Expense" : "New Expense Claim"}
                </AppText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={employeeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll} contentContainerStyle={[styles.form, { flexGrow: 1, paddingBottom: spacing.xxxl }]}>
                <AppText weight="600" style={{ marginBottom: spacing.xs, fontSize: 13 }} color={employeeColors.textSecondary}>
                  Expense Category
                </AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.lg }}>
                  {[
                    EXPENSE_CATEGORY.PETROL,
                    EXPENSE_CATEGORY.FOOD,
                    EXPENSE_CATEGORY.ACCOMMODATION,
                    EXPENSE_CATEGORY.OFFICE_SUPPLIES,
                    EXPENSE_CATEGORY.PRODUCTS,
                    EXPENSE_CATEGORY.OTHER,
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setExpenseType(cat)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
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
                  placeholder="Expense details..."
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: "top" }}
                />

                <Button
                  title={editingExpense ? "Update Expense" : "Submit Claim"}
                  loading={submitting}
                  onPress={handleSaveExpense}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
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
