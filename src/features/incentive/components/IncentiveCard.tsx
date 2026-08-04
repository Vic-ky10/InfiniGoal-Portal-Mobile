import React, { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar, Button } from "@/components/ui";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { IncentiveWithEmployee, IncentiveStatus } from "../incentive.types";

interface Props {
  incentive: IncentiveWithEmployee;
  onReview?: (id: string, status: IncentiveStatus) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (incentive: IncentiveWithEmployee) => void;
  onDelete?: (incentive: IncentiveWithEmployee) => void;
  showAvatar?: boolean;
  showActions?: boolean;
}

export default function IncentiveCard({
  incentive,
  onReview,
  onMarkPaid,
  onEdit,
  onDelete,
  showAvatar = true,
  showActions = true,
}: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const colors = useThemeColors();
  const employee = incentive.employee;
  const name = employee?.full_name ?? "Employee";

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
      await onReview(incentive.id, "Approved");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReview) return;
    setActionLoading(true);
    try {
      await onReview(incentive.id, "Rejected");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaid = async () => {
    if (!onMarkPaid) return;
    setActionLoading(true);
    try {
      await onMarkPaid(incentive.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.md,
              backgroundColor: `${colors.primary}10`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="award" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body" color={colors.text}>
              {incentive.title}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
              Type: {incentive.incentive_type}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Badge label={incentive.status} color={getStatusColor(incentive.status)} />
          {showActions && incentive.status === "Pending" && onEdit && (
            <TouchableOpacity onPress={() => onEdit(incentive)} style={{ padding: 4 }}>
              <Feather name="edit-2" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
          {showActions && incentive.status === "Pending" && onDelete && (
            <TouchableOpacity onPress={() => onDelete(incentive)} style={{ padding: 4 }}>
              <Feather name="trash-2" size={14} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MIDDLE */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText weight="700" variant="h2" color={colors.primary}>
            ₹{incentive.amount.toLocaleString()}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} weight="600">
            Period: {incentive.month}/{incentive.year}
          </AppText>
        </View>

        {incentive.description ? (
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={{ marginTop: 2, lineHeight: 18 }}
          >
            &quot;{incentive.description}&quot;
          </AppText>
        ) : null}
      </View>

      {/* FOOTER */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: `${colors.border}80`,
          paddingTop: spacing.sm,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
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
          label={incentive.payment_status}
          color={incentive.payment_status === "Paid" ? colors.success : colors.warning}
          variant="subtle"
        />
      </View>

      {/* ACTIONS */}
      {showActions && (
        <>
          {incentive.status === "Pending" && onReview && (
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Approve" onPress={handleApprove} loading={actionLoading} size="sm" />
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

          {incentive.status === "Approved" && incentive.payment_status === "Pending" && onMarkPaid && (
            <View style={{ marginTop: spacing.md }}>
              <Button title="Mark as Paid" onPress={handlePaid} loading={actionLoading} size="sm" />
            </View>
          )}
        </>
      )}
    </Card>
  );
}
