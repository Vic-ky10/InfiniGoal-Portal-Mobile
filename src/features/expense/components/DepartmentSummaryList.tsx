import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, shadows, radius } from "@/theme";
import { DepartmentSummary } from "../expense.types";

interface DepartmentSummaryListProps {
  departmentSummary: DepartmentSummary[];
}

export default function DepartmentSummaryList({ departmentSummary }: DepartmentSummaryListProps) {
  return (
    <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm, padding: spacing.lg }}>
      <AppText variant="h3" weight="700" color={adminColors.text}>
        Department Breakdowns
      </AppText>
      <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
        Expenses summarized by departments
      </AppText>

      {departmentSummary.length === 0 ? (
        <AppText variant="body" color={adminColors.textSecondary} style={{ marginTop: spacing.md, textAlign: "center" }}>
          No data available
        </AppText>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {departmentSummary.map((dept, i) => (
            <View
              key={dept.department || i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                borderBottomWidth: i < departmentSummary.length - 1 ? 1 : 0,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: spacing.sm }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.md,
                    backgroundColor: `${adminColors.primary}10`,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather name="briefcase" size={16} color={adminColors.primary} />
                </View>
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <AppText variant="body" weight="700" color={adminColors.text} numberOfLines={1}>
                    {dept.department || "Other"}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary}>
                    {dept.count} {dept.count === 1 ? "claim" : "claims"}
                  </AppText>
                </View>
              </View>

              <View style={{ alignItems: "flex-end", minWidth: 95 }}>
                <AppText variant="body" weight="700" color={adminColors.text}>
                  ₹{dept.totalAmount.toLocaleString("en-IN")}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
