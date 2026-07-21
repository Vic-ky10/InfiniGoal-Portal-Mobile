import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Avatar } from "@/components/ui";
import { adminColors, spacing } from "@/theme";
import { AttendanceWithEmployee } from "../attendance.types";

interface Props {
  record: AttendanceWithEmployee;
}

export default function AttendanceCard({ record }: Props) {
  const employee = record.employee;
  const name = employee?.full_name ?? "Unknown Employee";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return adminColors.success;
      case "Incomplete":
        return adminColors.warning;
      case "Absent":
        return adminColors.danger;
      default:
        return adminColors.textSecondary;
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
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
        <Avatar name={name} size={40} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <AppText weight="700">{name}</AppText>
          <AppText variant="caption" color={adminColors.textSecondary}>
            {employee?.employee_id ? `${employee.employee_id} • ` : ""}{record.attendance_date}
          </AppText>
        </View>
        <Badge label={record.status} color={getStatusColor(record.status)} />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: adminColors.background,
          padding: spacing.md,
          borderRadius: spacing.sm,
          marginTop: spacing.xs,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <AppText variant="caption" color={adminColors.textSecondary}>
            In Time
          </AppText>
          <AppText weight="600" style={{ marginTop: 2 }}>
            {formatTime(record.login_time)}
          </AppText>
        </View>

        <View style={{ alignItems: "center" }}>
          <AppText variant="caption" color={adminColors.textSecondary}>
            Out Time
          </AppText>
          <AppText weight="600" style={{ marginTop: 2 }}>
            {formatTime(record.logout_time)}
          </AppText>
        </View>

        <View style={{ alignItems: "center" }}>
          <AppText variant="caption" color={adminColors.textSecondary}>
            Working Hours
          </AppText>
          <AppText weight="600" color={adminColors.primary} style={{ marginTop: 2 }}>
            {record.working_hours ? `${record.working_hours.toFixed(1)} hrs` : "--"}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
