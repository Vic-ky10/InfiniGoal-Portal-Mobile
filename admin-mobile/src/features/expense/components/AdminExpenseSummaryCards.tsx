import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, shadows } from "@/theme";
import { AdminExpenseSummary } from "../expense.types";

interface AdminExpenseSummaryCardsProps {
  summary: AdminExpenseSummary;
}

export default function AdminExpenseSummaryCards({ summary }: AdminExpenseSummaryCardsProps) {
  const cards = [
    {
      title: "Total Expense",
      value: `₹${summary.totalCompanyExpense.toLocaleString("en-IN")}`,
      count: `${summary.totalExpenseCount} claims`,
      icon: "credit-card" as const,
      color: adminColors.primary,
    },
    {
      title: "Approved",
      value: `₹${summary.approvedAmount.toLocaleString("en-IN")}`,
      count: "Approved claims",
      icon: "check-circle" as const,
      color: adminColors.success,
    },
    {
      title: "Pending",
      value: `₹${summary.pendingAmount.toLocaleString("en-IN")}`,
      count: "Pending review",
      icon: "clock" as const,
      color: adminColors.warning,
    },
    {
      title: "Rejected",
      value: `₹${summary.rejectedAmount.toLocaleString("en-IN")}`,
      count: "Rejected claims",
      icon: "alert-octagon" as const,
      color: adminColors.danger,
    },
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {cards.slice(0, 2).map((c, i) => (
          <Card
            key={i}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: adminColors.border,
              ...shadows.sm,
              padding: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <AppText variant="caption" color={adminColors.textSecondary} weight="600">
                  {c.title}
                </AppText>
                <AppText
                  variant="body"
                  weight="700"
                  color={adminColors.text}
                  style={{ marginTop: spacing.xs, fontSize: 18 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {c.value}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: spacing.xs }}>
                  {c.count}
                </AppText>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${c.color}15`,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Feather name={c.icon} size={18} color={c.color} />
              </View>
            </View>
          </Card>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {cards.slice(2, 4).map((c, i) => (
          <Card
            key={i}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: adminColors.border,
              ...shadows.sm,
              padding: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <AppText variant="caption" color={adminColors.textSecondary} weight="600">
                  {c.title}
                </AppText>
                <AppText
                  variant="body"
                  weight="700"
                  color={adminColors.text}
                  style={{ marginTop: spacing.xs, fontSize: 18 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {c.value}
                </AppText>
                <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: spacing.xs }}>
                  {c.count}
                </AppText>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${c.color}15`,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Feather name={c.icon} size={18} color={c.color} />
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}
