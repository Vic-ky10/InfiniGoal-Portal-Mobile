import { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar, Button } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { IncentiveWithEmployee, IncentiveStatus } from "../incentive.types";

interface Props {
  incentive: IncentiveWithEmployee;
  onReview: (id: string, status: IncentiveStatus) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (incentive: IncentiveWithEmployee) => void;
  onDelete?: (incentive: IncentiveWithEmployee) => void;
}

export default function IncentiveCard({ incentive, onReview, onMarkPaid, onEdit, onDelete }: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const employee = incentive.employee;
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
      await onReview(incentive.id, "Approved");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await onReview(incentive.id, "Rejected");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaid = async () => {
    setActionLoading(true);
    try {
      await onMarkPaid(incentive.id);
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
            {incentive.incentive_code} • {incentive.incentive_type}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Badge label={incentive.status} color={getStatusColor(incentive.status)} />
          {incentive.status === "Pending" && onEdit && (
            <TouchableOpacity onPress={() => onEdit(incentive)} style={{ padding: 4 }}>
              <Feather name="edit-2" size={16} color={adminColors.primary} />
            </TouchableOpacity>
          )}
          {incentive.status === "Pending" && onDelete && (
            <TouchableOpacity onPress={() => onDelete(incentive)} style={{ padding: 4 }}>
              <Feather name="trash-2" size={16} color={adminColors.danger} />
            </TouchableOpacity>
          )}
        </View>
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
          <AppText weight="600" variant="body">
            {incentive.title}
          </AppText>
          <AppText weight="700" variant="h3" color={adminColors.primary}>
            ₹{incentive.amount.toLocaleString()}
          </AppText>
        </View>

        {incentive.description ? (
          <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: spacing.xs }}>
          Description :&quot;{incentive.description}&quot;
          </AppText>
        ) : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
          <AppText variant="caption" color={adminColors.textSecondary}>
            Period: {incentive.month}/{incentive.year}
          </AppText>
          <Badge
            label={incentive.payment_status}
            color={incentive.payment_status === "Paid" ? adminColors.success : adminColors.warning}
            variant="subtle"
          />
        </View>
      </View>

      {incentive.status === "Pending" && (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button title="Approve" onPress={handleApprove} loading={actionLoading} size="sm" />
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

      {incentive.status === "Approved" && incentive.payment_status === "Pending" && (
        <Button title="Mark as Paid" onPress={handlePaid} loading={actionLoading} size="sm" />
      )}
    </Card>
  );
}
