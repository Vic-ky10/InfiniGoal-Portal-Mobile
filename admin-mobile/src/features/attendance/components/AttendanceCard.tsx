import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar } from "@/components/ui";
import { useThemeColors, spacing, radius, shadows } from "@/theme";
import { AttendanceWithEmployee } from "../attendance.types";

interface Props {
  record: AttendanceWithEmployee;
  showAvatar?: boolean;
}

export default function AttendanceCard({
  record,
  showAvatar = true,
}: Props) {
  const colors = useThemeColors();
  const employee = record.employee;
  const name = employee?.full_name ?? "Unknown Employee";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return colors.success;
      case "Short Hours":
        return colors.warning;
      case "Half Day":
        return colors.primary;
      case "Incomplete":
        return colors.warning;
      case "Absent":
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "--:--";
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
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
            <Feather name="clock" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body" color={colors.text}>
              {record.attendance_date}
            </AppText>
          </View>
        </View>
        <Badge label={record.status} color={getStatusColor(record.status)} />
      </View>

      {/* MIDDLE */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: colors.surface,
          padding: spacing.md,
          borderRadius: radius.md,
          marginBottom: spacing.xs,
        }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            Log In Time
          </AppText>
          <AppText weight="700" style={{ marginTop: 4 }} color={colors.text}>
            {formatTime(record.login_time)}
          </AppText>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: colors.border,
            marginHorizontal: spacing.sm,
          }}
        />

        <View style={{ alignItems: "center", flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            Log Out Time
          </AppText>
          <AppText weight="700" style={{ marginTop: 4 }} color={colors.text}>
            {formatTime(record.logout_time)}
          </AppText>
        </View>

        <View
          style={{
            width: 1,
            backgroundColor: colors.border,
            marginHorizontal: spacing.sm,
          }}
        />

        <View style={{ alignItems: "center", flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            Working Hours
          </AppText>
          <AppText weight="700" color={colors.primary} style={{ marginTop: 4 }}>
            {record.working_hours !== null
              ? `${record.working_hours.toFixed(1)} hrs`
              : "--"}
          </AppText>
        </View>
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
            marginTop: spacing.sm,
          }}
        >
          <Avatar name={name} size={20} />
          <AppText variant="caption" color={colors.textSecondary}>
            {name}
          </AppText>
        </View>
      )}
    </Card>
  );
}
