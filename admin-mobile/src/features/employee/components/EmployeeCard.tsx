import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Avatar, Badge } from "@/components/ui";
import { adminColors, spacing } from "@/theme";
import { Employee } from "../employee.types";

interface Props {
  employee: Employee;
  onPress: () => void;
}

export default function EmployeeCard({
  employee,
  onPress,
}: Props) {
  const isActive = employee.status === "Active";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar
            uri={employee.avatar_url}
            name={employee.full_name}
            size={48}
          />

          <View style={{ flex: 1, marginLeft: spacing.md, gap: spacing.xs }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText weight="700" variant="body">
                {employee.full_name}
              </AppText>
              <Badge
                label={employee.status}
                color={isActive ? adminColors.success : adminColors.disabled}
              />
            </View>

            <AppText variant="caption" color={adminColors.textSecondary}>
              {employee.employee_id} • {employee.designation || employee.role}
            </AppText>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.xs }}>
              <Feather name="briefcase" size={12} color={adminColors.textSecondary} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={adminColors.textSecondary}>
                {employee.department ?? "Unassigned"}
              </AppText>
            </View>
          </View>

          <Feather name="chevron-right" size={18} color={adminColors.textSecondary} style={{ marginLeft: spacing.xs }} />
        </View>
      </Card>
    </Pressable>
  );
}
