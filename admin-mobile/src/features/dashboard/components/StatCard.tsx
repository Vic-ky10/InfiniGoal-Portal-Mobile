import { View } from "react-native";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing } from "@/theme";

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  color = adminColors.primary,
}: StatCardProps) {
  return (
    <Card>
      <AppText color={adminColors.textSecondary}>
        {title}
      </AppText>

      <AppText
        variant="h1"
        weight="700"
        color={color}
        style={{ marginTop: spacing.sm }}
      >
        {value}
      </AppText>
    </Card>
  );
}