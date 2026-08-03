import { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";

import { Card, AppText, Badge, Avatar, Button } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { ExpenseWithEmployee, ExpenseStatus } from "../expense.types";

interface Props {
  expense: ExpenseWithEmployee;
  onReview: (id: string, status: ExpenseStatus, approvedAmount: number) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ExpenseCard({ expense, onReview, onMarkPaid }: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const employee = expense.employee;
  const name = employee?.full_name ?? "Employee";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return adminColors.success;
      case "Rejected":
        return adminColors.danger;
      case "Pending":
        return adminColors.warning;
      default:
        return adminColors.disabled;
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onReview(expense.id, "Approved", expense.amount);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await onReview(expense.id, "Rejected", 0);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaid = async () => {
    setActionLoading(true);
    try {
      await onMarkPaid(expense.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
        <Avatar name={name} size={42} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <AppText weight="700">{name}</AppText>
          <AppText variant="caption" color={adminColors.textSecondary}>
            {expense.expense_code} • {expense.expense_type}
          </AppText>
        </View>
        <Badge label={expense.status} color={getStatusColor(expense.status)} />
      </View>

      <View
        style={{
          backgroundColor: adminColors.background,
          padding: spacing.md,
          borderRadius: radius.md,
          gap: spacing.xs,
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText variant="caption" color={adminColors.textSecondary}>
            Date: {expense.expense_date}
          </AppText>
          <AppText weight="700" variant="h3" color={adminColors.primary}>
            ₹{expense.amount.toLocaleString()}
          </AppText>
        </View>

        {expense.description ? (
          <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: spacing.xs }}>
          Reasons: &quot;{expense.description}&quot;
          </AppText>
        ) : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
          <AppText variant="caption" color={adminColors.textSecondary}>
            Payment Status:
          </AppText>
          <Badge
            label={expense.payment_status}
            color={expense.payment_status === "Paid" ? adminColors.success : adminColors.warning}
            variant="subtle"
          />
        </View>
      </View>

      {expense.status === "Pending" && (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
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
              backgroundColor: adminColors.danger,
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

      {expense.status === "Approved" && expense.payment_status === "Pending" && (
        <Button
          title="Mark as Paid"
          onPress={handlePaid}
          loading={actionLoading}
          size="sm"
        />
      )}
    </Card>
  );
}
