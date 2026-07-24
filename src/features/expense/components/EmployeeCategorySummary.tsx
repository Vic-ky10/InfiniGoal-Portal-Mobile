import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { CategorySummary } from "../expense.types";

const categoryMeta: Record<string, { icon: string; color: string }> = {
  "Food": { icon: "coffee", color: "#F97316" },
  "Accommodation": { icon: "home", color: "#6366F1" },
  "Office Supplies": { icon: "paperclip", color: "#06B6D4" },
  "Petrol Charges": { icon: "droplet", color: "#F59E0B" },
  "Products": { icon: "box", color: "#10B981" },
  "Other": { icon: "tag", color: "#64748B" },
};

interface EmployeeCategorySummaryProps {
  categorySummary: CategorySummary[];
  totalExpenses: number;
}

export default function EmployeeCategorySummary({ categorySummary, totalExpenses }: EmployeeCategorySummaryProps) {
  const activeCategories = categorySummary
    .filter((cat) => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm, padding: spacing.lg }}>
      <AppText variant="h3" weight="700" color={adminColors.text}>
        Expense Categories
      </AppText>
      <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
        Breakdown of your spending by category
      </AppText>

      {activeCategories.length === 0 ? (
        <AppText variant="body" color={adminColors.textSecondary} style={{ marginTop: spacing.md, textAlign: "center" }}>
          No category breakdowns available
        </AppText>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {activeCategories.map((cat, i) => {
            const meta = categoryMeta[cat.category] || { icon: "tag", color: "#64748B" };
            const percent = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;

            return (
              <View key={cat.category || i} style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: spacing.sm }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radius.md,
                        backgroundColor: `${meta.color}15`,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Feather name={meta.icon as any} size={16} color={meta.color} />
                    </View>
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                      <AppText variant="body" weight="700" color={adminColors.text} numberOfLines={1}>
                        {cat.category}
                      </AppText>
                      <AppText variant="caption" color={adminColors.textSecondary}>
                        {cat.count} {cat.count === 1 ? "claim" : "claims"}
                      </AppText>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end", minWidth: 95 }}>
                    <AppText variant="body" weight="700" color={adminColors.text}>
                      ₹{cat.amount.toLocaleString("en-IN")}
                    </AppText>
                    <AppText variant="caption" color={adminColors.textSecondary}>
                      {percent.toFixed(1)}%
                    </AppText>
                  </View>
                </View>

                {/* Custom Progress Bar */}
                <View
                  style={{
                    height: 6,
                    width: "100%",
                    backgroundColor: "#F1F5F9",
                    borderRadius: radius.full,
                    marginTop: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${percent}%`,
                      backgroundColor: meta.color,
                      borderRadius: radius.full,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
