import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import {
  adminColors,
  employeeColors,
  useThemeColors,
  spacing,
  shadows,
} from "@/theme";

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon?: string;
  onPress?: () => void;
  theme?: "admin" | "employee";
}

export default function StatCard({
  title,
  value,
  color,
  icon,
  onPress,
  theme,
}: StatCardProps) {
  const fallbackColors = useThemeColors();
  const colors =
    theme === "employee"
      ? employeeColors
      : theme === "admin"
        ? adminColors
        : fallbackColors;
  const activeColor = color || colors.primary;

  const Content = (
    <Card
      style={{
        flex: 1,
        minWidth: 175,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
       
      }}
    >
      {/* Icon badge */}
      {icon && (
        <View
          style={[styles.iconBadge, { backgroundColor: `${activeColor}15` }]}
        >
          <Feather name={icon as any} size={16} color={activeColor} />
        </View>
      )}

      {/* Value */}
      <AppText
        variant="h1"
        weight="700"
        color={colors.text}
        style={styles.value}
      >
        {value}
      </AppText>

      {/* Title row with optional chevron */}
      <View style={styles.titleRow}>
        <AppText
          variant="caption"
          color={colors.textSecondary}
          weight="500"
          style={styles.title}
        >
          {title}
        </AppText>
        {onPress && (
          <Feather
            name="chevron-right"
            size={12}
            color={colors.textSecondary}
          />
        )}
      </View>

      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: `${activeColor}30` }]}>
        <View style={[styles.accentFill, { backgroundColor: activeColor }]} />
      </View>
    </Card>
  );

  if (!onPress) return Content;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "transparent" }}
      style={{
        flex: 1,
        borderRadius: 24,
      }}
    >
      {Content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  value: {
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  title: {
    flex: 1,
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  accentFill: {
    width: "40%",
    height: "100%",
    borderRadius: 2,
  },
});
