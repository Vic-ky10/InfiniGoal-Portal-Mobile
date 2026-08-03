import { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar, Button } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { LeaveRequestWithEmployee, LeaveStatus } from "../leave.types";

interface Props {
  leave: LeaveRequestWithEmployee;
  onReview: (
    id: string,
    status: LeaveStatus,
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function LeaveCard({ leave, onReview }: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const employee = leave.employee;
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

  const handleAction = async (status: LeaveStatus) => {
    setActionLoading(true);
    try {
      await onReview(leave.id, status);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.md,
        }}
      >
        <Avatar name={name} size={42} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <AppText weight="700">{name}</AppText>
          <AppText variant="caption" color={adminColors.textSecondary}>
            {employee?.department ? `${employee.department} • ` : ""}
            {leave.leave_type} Leave
          </AppText>
        </View>
        <Badge label={leave.status} color={getStatusColor(leave.status)} />
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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather
            name="calendar"
            size={14}
            color={adminColors.primary}
            style={{ marginRight: 6 }}
          />
          <AppText variant="caption" weight="600">
          Dates:  {leave.start_date}  to  {leave.end_date}
          </AppText>
        </View>
        {leave.reason ? (
          <AppText
            variant="caption"
            color={adminColors.textSecondary}
            style={{ marginTop: spacing.xs }}
          >
           Reason : &quot;{leave.reason}&quot;
          </AppText>
        ) : null}

        {leave.review_comment ? (
          <AppText
            variant="caption"
            color={adminColors.textSecondary}
            style={{ fontStyle: "italic", marginTop: spacing.xs }}
          >
            Review note: {leave.review_comment}
          </AppText>
        ) : null}
      </View>

      {leave.status === "Pending" && (
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Approve"
              onPress={() => handleAction("Approved")}
              loading={actionLoading}
            />
          </View>
          <TouchableOpacity
            disabled={actionLoading}
            onPress={() => handleAction("Rejected")}
            style={{
              flex: 1,
              backgroundColor: adminColors.danger,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.lg,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText weight="700" color="#fff">
                Reject
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}
