import { View } from "react-native";

import { Card, AppText, Avatar } from "@/components/ui";
import { adminColors, spacing, shadows } from "@/theme";
import { TopEmployeeSummary } from "../expense.types";

interface TopEmployeesListProps {
  topEmployees: TopEmployeeSummary[];
}

export default function TopEmployeesList({ topEmployees }: TopEmployeesListProps) {
  return (
    <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm, padding: spacing.lg }}>
      <AppText variant="h3" weight="700" color={adminColors.text}>
        Top Spending Employees
      </AppText>
      <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
        Highest expense submitters
      </AppText>

      {topEmployees.length === 0 ? (
        <AppText variant="body" color={adminColors.textSecondary} style={{ marginTop: spacing.md, textAlign: "center" }}>
          No data available
        </AppText>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {topEmployees.map((emp, i) => (
            <View
              key={emp.profileId || i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                borderBottomWidth: i < topEmployees.length - 1 ? 1 : 0,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: spacing.sm }}>
                <Avatar name={emp.name} size={40} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <AppText variant="body" weight="700" color={adminColors.text} numberOfLines={1}>
                    {emp.name}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary} numberOfLines={1}>
                    {emp.email}
                  </AppText>
                </View>
              </View>

              <View style={{ alignItems: "flex-end", minWidth: 90 }}>
                <AppText variant="body" weight="700" color={adminColors.text}>
                  ₹{emp.totalAmount.toLocaleString("en-IN")}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary}>
                  {emp.count} {emp.count === 1 ? "claim" : "claims"}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
