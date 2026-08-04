import React, { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar, Button } from "@/components/ui";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { LeaveRequestWithEmployee, LeaveStatus } from "../leave.types";

interface Props {
  leave: LeaveRequestWithEmployee;
  onReview?: (
    id: string,
    status: LeaveStatus,
  ) => Promise<{ success: boolean; error?: string }>;
  showAvatar?: boolean;
  showActions?: boolean;
  onCancel?: () => void;
}

export default function LeaveCard({
  leave,
  onReview,
  showAvatar = true,
  showActions = true,
  onCancel,
}: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const colors = useThemeColors();
  const employee = leave.employee;
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

  const handleAction = async (status: LeaveStatus) => {
    if (!onReview) return;
    setActionLoading(true);
    try {
      await onReview(leave.id, status);
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
            <Feather name="calendar" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body" color={colors.text}>
              {leave.leave_type} Leave
            </AppText>
          </View>
        </View>
        <Badge label={leave.status} color={getStatusColor(leave.status)} />
      </View>

      {/* MIDDLE */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Feather name="clock" size={12} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} weight="600">
            Timeline: {leave.start_date} to {leave.end_date} ({leave.total_days} day{leave.total_days > 1 ? "s" : ""})
          </AppText>
        </View>

        {leave.reason ? (
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={{ marginTop: 2, lineHeight: 18 }}
          >
            Reason: &quot;{leave.reason}&quot;
          </AppText>
        ) : null}

        {leave.review_comment ? (
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={{ fontStyle: "italic", marginTop: 2, lineHeight: 18 }}
          >
            Review note: {leave.review_comment}
          </AppText>
        ) : null}
      </View>

      {/* FOOTER */}
      {showAvatar && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: `${colors.border}80`,
            paddingTop: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          <Avatar name={name} size={20} />
          <AppText variant="caption" color={colors.textSecondary}>
            {name} {employee?.department ? `• ${employee.department}` : ""}
          </AppText>
        </View>
      )}

      {/* ACTIONS */}
      {showActions && leave.status === "Pending" && onReview && (
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Approve"
              onPress={() => handleAction("Approved")}
              loading={actionLoading}
              size="sm"
            />
          </View>
          <TouchableOpacity
            disabled={actionLoading}
            onPress={() => handleAction("Rejected")}
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

      {leave.status === "Pending" && onCancel && (
        <View style={{ marginTop: spacing.md }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              backgroundColor: `${colors.danger}10`,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.sm,
            }}
          >
            <AppText variant="caption" weight="700" color={colors.danger}>
              Cancel Leave Request
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}
