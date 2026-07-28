import { View, TouchableOpacity, Platform, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius, shadows } from "@/theme";

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
    <Card
      style={{
        flex: 1,
        minWidth: 140,
        borderWidth: 1,
        borderColor: adminColors.border,
        ...shadows.sm,
      }}
    >
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
            weight="600"
          >
            {title}
          </AppText>

          <AppText
            variant="h1"
            weight="700"
            color={adminColors.text}
            style={{ marginTop: spacing.xs }}
          >
            {value}
          </AppText>
        </View>

        <View style={{ alignItems: "center", gap: spacing.sm }}>
          {icon && (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: `${color}10`,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather name={icon} size={18} color={color} />
            </View>
          )}

          {onPress && (
            <Feather
              name="chevron-right"
              size={14}
              color={adminColors.textSecondary}
            />
          )}
        </View>
      </View>
    </Card>
  );

  if (!onPress) return Content;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "transparent" }}
      style={({ pressed }) => [
        {
          flex: 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.98 : 1,
          borderRadius: 24,
        },
      ]}
    >
      {Content}
    </Pressable>
  );
}
