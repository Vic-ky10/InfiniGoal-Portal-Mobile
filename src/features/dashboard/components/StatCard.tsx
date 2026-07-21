import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius } from "@/theme";

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  color = adminColors.primary,
  icon,
}: StatCardProps) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={adminColors.textSecondary} weight="500">
            {title}
          </AppText>

          <AppText
            variant="h1"
            weight="700"
            color={color}
            style={{ marginTop: spacing.xs }}
          >
            {value}
          </AppText>
        </View>

        {icon && (
          <View
            style={{
              padding: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: `${color}15`,
            }}
          >
            <Feather name={icon} size={20} color={color} />
          </View>
        )}
      </View>
    </Card>
  );
}