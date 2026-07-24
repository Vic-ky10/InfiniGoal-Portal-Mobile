import { View } from "react-native";

import { Card, AppText, Badge } from "@/components/ui";
import { adminColors, spacing, shadows } from "@/theme";
import { ExpenseWithEmployee } from "../expense.types";

interface RecentActivityListProps {
  recentExpenses: ExpenseWithEmployee[];
}

export default function RecentActivityList({ recentExpenses }: RecentActivityListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return adminColors.success;
      case "Rejected":
        return adminColors.danger;
      default:
        return adminColors.warning;
    }
  };

  return (
    <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm, padding: spacing.lg }}>
      <AppText variant="h3" weight="700" color={adminColors.text}>
        Recent Expense Activity
      </AppText>
      <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
        Latest expense submissions from employees
      </AppText>

      {recentExpenses.length === 0 ? (
        <AppText variant="body" color={adminColors.textSecondary} style={{ marginTop: spacing.md, textAlign: "center" }}>
          No recent activity found
        </AppText>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {recentExpenses.map((exp, i) => (
            <View
              key={exp.id || i}
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: i < recentExpenses.length - 1 ? 1 : 0,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.xs }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="700" color={adminColors.text} numberOfLines={1}>
                    {exp.employee?.full_name ?? "Unknown"}
                  </AppText>
                  <AppText variant="body" color={adminColors.textSecondary} style={{ marginTop: 2, fontSize: 13 }} numberOfLines={2}>
                    {exp.description}
                  </AppText>
                </View>

                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <AppText variant="body" weight="700" color={adminColors.text}>
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </AppText>
                  <Badge label={exp.status} color={getStatusColor(exp.status)} />
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: spacing.sm,
                }}
              >
                <AppText variant="caption" color={adminColors.textSecondary}>
                  Category: {exp.expense_type}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary}>
                  {new Date(exp.expense_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
