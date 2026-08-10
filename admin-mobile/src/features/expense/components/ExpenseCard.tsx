import React, { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar, Button } from "@/components/ui";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { ExpenseWithEmployee, ExpenseStatus } from "../expense.types";
import { getCategoryIconName, formatSmartExpenseTitle } from "../utils/expenseCategoryIcon";
import ReceiptViewerModal from "./ReceiptViewerModal";

interface Props {
  expense: ExpenseWithEmployee;
  onReview?: (id: string, status: ExpenseStatus, approvedAmount: number) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid?: (id: string) => Promise<{ success: boolean; error?: string }>;
  showAvatar?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onPressDetails?: (expense: ExpenseWithEmployee) => void;
}

export default function ExpenseCard({
  expense,
  onReview,
  onMarkPaid,
  showAvatar = true,
  showActions = true,
  onEdit,
  onPressDetails,
}: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptViewerVisible, setReceiptViewerVisible] = useState(false);
  const colors = useThemeColors();
  const employee = expense.employee;
  const name = employee?.full_name ?? "Employee";

  const iconName = getCategoryIconName(expense.expense_type);
  const smartTitle = formatSmartExpenseTitle(expense.expense_type, expense.expense_date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return colors.success;
      case "Rejected":
        return colors.danger;
      case "Pending":
        return colors.warning;
      default:
        return colors.disabled;
    }
  };

  const handleApprove = async () => {
    if (!onReview) return;
    setActionLoading(true);
    try {
      await onReview(expense.id, "Approved", expense.amount);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReview) return;
    setActionLoading(true);
    try {
      await onReview(expense.id, "Rejected", 0);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaid = async () => {
    if (!onMarkPaid) return;
    setActionLoading(true);
    try {
      await onMarkPaid(expense.id);
    } finally {
      setActionLoading(false);
    }
  };

  const hasReceipt = Boolean(expense.receipt_url);

  return (
    <>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPressDetails?.(expense)}
      >
        <Card
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            ...shadows.sm,
            padding: spacing.md,
            backgroundColor: colors.background,
            marginBottom: spacing.md,
          }}
        >
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}12` }]}>
                <Feather name={iconName} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="700" variant="body" color={colors.text}>
                  {smartTitle}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2, fontSize: 12 }}>
                  Category: {expense.expense_type} • Submitted: {expense.expense_date}
                </AppText>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Badge label={expense.status} color={getStatusColor(expense.status)} />
              {expense.status === "Pending" && onEdit && (
                <TouchableOpacity onPress={onEdit} style={[styles.editBtn, { backgroundColor: `${colors.primary}10` }]}>
                  <Feather name="edit-2" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* MIDDLE */}
          <View style={styles.middleRow}>
            <View style={styles.amountContainer}>
              <AppText weight="700" variant="h2" color={colors.primary}>
                ₹{expense.amount.toLocaleString("en-IN")}
              </AppText>

              {/* RECEIPT BADGE */}
              <TouchableOpacity
                disabled={!hasReceipt}
                onPress={(e) => {
                  e.stopPropagation();
                  setReceiptViewerVisible(true);
                }}
                style={[
                  styles.receiptBadge,
                  {
                    backgroundColor: hasReceipt ? "#EFF6FF" : "#F3F4F6",
                    borderColor: hasReceipt ? "#BFDBFE" : "#E5E7EB",
                  },
                ]}
              >
                <Feather name="paperclip" size={12} color={hasReceipt ? "#2563EB" : "#9CA3AF"} />
                <AppText
                  variant="caption"
                  weight="600"
                  color={hasReceipt ? "#2563EB" : "#6B7280"}
                  style={{ fontSize: 11 }}
                >
                  {hasReceipt ? "📎 Receipt Attached" : "No Attachment"}
                </AppText>
              </TouchableOpacity>
            </View>

            {expense.description ? (
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={{ marginTop: spacing.xs, lineHeight: 18 }}
                numberOfLines={2}
              >
                {expense.description}
              </AppText>
            ) : null}

            {expense.review_comment ? (
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={{ fontStyle: "italic", marginTop: 4, lineHeight: 18 }}
              >
                Manager Note: {expense.review_comment}
              </AppText>
            ) : null}
          </View>

          {/* FOOTER */}
          <View style={[styles.footerRow, { borderTopColor: `${colors.border}80` }]}>
            <View style={styles.employeeInfo}>
              {showAvatar && (
                <>
                  <Avatar name={name} size={20} />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {name}
                  </AppText>
                </>
              )}
            </View>

            <Badge
              label={expense.payment_status}
              color={expense.payment_status === "Paid" ? colors.success : colors.warning}
              variant="subtle"
            />
          </View>

          {/* ACTIONS */}
          {showActions && (
            <>
              {expense.status === "Pending" && onReview && (
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Approve"
                      onPress={handleApprove}
                      loading={actionLoading}
                      size="sm"
                    />
                  </View>
                  <TouchableOpacity
                    disabled={actionLoading}
                    onPress={handleReject}
                    style={{
                      flex: 1,
                      backgroundColor: colors.danger,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: spacing.xs,
                      minHeight: 34,
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <AppText variant="caption" weight="700" color="#fff">
                        Reject
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {expense.status === "Approved" && expense.payment_status === "Pending" && onMarkPaid && (
                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title="Mark as Paid"
                    onPress={handlePaid}
                    loading={actionLoading}
                    size="sm"
                  />
                </View>
              )}
            </>
          )}
        </Card>
      </TouchableOpacity>

      {/* RECEIPT VIEWER MODAL */}
      <ReceiptViewerModal
        visible={receiptViewerVisible}
        receiptUrl={expense.receipt_url}
        receiptName={expense.receipt_name}
        receiptType={expense.receipt_type}
        onClose={() => setReceiptViewerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  editBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  middleRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  receiptBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  footerRow: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  employeeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
