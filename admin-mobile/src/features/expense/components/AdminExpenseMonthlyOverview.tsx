import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { MonthlySummary } from "../expense.types";

interface AdminExpenseMonthlyOverviewProps {
  monthlySummary: MonthlySummary[];
}

export default function AdminExpenseMonthlyOverview({ monthlySummary }: AdminExpenseMonthlyOverviewProps) {
  const now = new Date();

  const formatMonthKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const currentMonthKey = formatMonthKey(now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = formatMonthKey(prevMonthDate);

  const currentData = monthlySummary.find((m) => m.month === currentMonthKey);
  const prevData = monthlySummary.find((m) => m.month === prevMonthKey);

  const currentAmount = currentData?.amount ?? 0;
  const prevAmount = prevData?.amount ?? 0;

  const diff = currentAmount - prevAmount;
  const diffPercent = prevAmount > 0 ? (diff / prevAmount) * 100 : 0;

  const getMonthName = (key: string) => {
    const [year, month] = key.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  const currentMonthName = getMonthName(currentMonthKey);
  const prevMonthName = getMonthName(prevMonthKey);

  const maxAmount = Math.max(currentAmount, prevAmount, 1);
  const currentProgress = (currentAmount / maxAmount) * 100;
  const prevProgress = (prevAmount / maxAmount) * 100;

  const isUp = diff > 0;
  const isDown = diff < 0;

  return (
    <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm, padding: spacing.lg }}>
      <AppText variant="h3" weight="700" color={adminColors.text}>
        Monthly Overview
      </AppText>
      <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
        Comparison of current and previous months
      </AppText>

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        {/* Current Month */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <AppText variant="body" weight="600" color={adminColors.text}>
              {currentMonthName} (Current)
            </AppText>
            <AppText variant="body" weight="700" color={adminColors.text}>
              ₹{currentAmount.toLocaleString("en-IN")}
            </AppText>
          </View>
          {/* Progress bar */}
          <View style={{ height: 8, width: "100%", backgroundColor: "#F1F5F9", borderRadius: radius.full, marginTop: spacing.xs, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${currentProgress}%`, backgroundColor: adminColors.primary, borderRadius: radius.full }} />
          </View>
          <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 4 }}>
            {currentData?.count ?? 0} claims submitted
          </AppText>
        </View>

        {/* Previous Month */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <AppText variant="body" weight="600" color={adminColors.text}>
              {prevMonthName} (Previous)
            </AppText>
            <AppText variant="body" weight="700" color={adminColors.text}>
              ₹{prevAmount.toLocaleString("en-IN")}
            </AppText>
          </View>
          {/* Progress bar */}
          <View style={{ height: 8, width: "100%", backgroundColor: "#F1F5F9", borderRadius: radius.full, marginTop: spacing.xs, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${prevProgress}%`, backgroundColor: "#94A3B8", borderRadius: radius.full }} />
          </View>
          <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 4 }}>
            {prevData?.count ?? 0} claims submitted
          </AppText>
        </View>
      </View>

      {/* Difference Box */}
      <View
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: "#F8FAFC",
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: "#E2E8F0",
        }}
      >
        <AppText variant="caption" color={adminColors.textSecondary} weight="700" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          Difference
        </AppText>
        <AppText variant="h2" weight="700" color={adminColors.text} style={{ marginTop: 4 }}>
          ₹{Math.abs(diff).toLocaleString("en-IN")}
        </AppText>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
          {isUp ? (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md, borderWidth: 1, borderColor: "#FEE2E2" }}>
              <Feather name="trending-up" size={14} color={adminColors.danger} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={adminColors.danger} weight="700">
                {diffPercent.toFixed(1)}% higher
              </AppText>
            </View>
          ) : isDown ? (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md, borderWidth: 1, borderColor: "#DCFCE7" }}>
              <Feather name="trending-down" size={14} color={adminColors.success} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={adminColors.success} weight="700">
                {Math.abs(diffPercent).toFixed(1)}% lower
              </AppText>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md, borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Feather name="minus" size={14} color={adminColors.textSecondary} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={adminColors.textSecondary} weight="700">
                No change
              </AppText>
            </View>
          )}
          <AppText variant="caption" color={adminColors.textSecondary}>
            than last month
          </AppText>
        </View>
      </View>
    </Card>
  );
}
