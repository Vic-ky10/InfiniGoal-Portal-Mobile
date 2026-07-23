import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius } from "@/theme";

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon?: string;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  color = adminColors.primary,
  icon,
  onPress,
}: StatCardProps) {
  const Content = (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText
            variant="caption"
            color={adminColors.textSecondary}
            weight="500"
          >
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
        </View>

        <View style={{ alignItems: "center", gap: spacing.sm }}>
          {icon && (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.lg,
                backgroundColor: `${color}15`,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather
                name={icon}
                size={20}
                color={color}
              />
            </View>
          )}

          {onPress && (
            <Feather
              name="chevron-right"
              size={16}
              color={adminColors.textSecondary}
            />
          )}
        </View>
      </View>
    </Card>
  );

  if (!onPress) return Content;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      {Content}
    </TouchableOpacity>
  );
}