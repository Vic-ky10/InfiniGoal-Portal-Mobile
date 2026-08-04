import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, employeeColors, useThemeColors, radius, spacing, shadows } from "@/theme";

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  accentColor?: string;
  theme?: "admin" | "employee";
}

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
  accentColor,
  theme,
}: Props) {
  const fallbackColors = useThemeColors();
  const colors = theme === "employee" ? employeeColors : theme === "admin" ? adminColors : fallbackColors;
  const actualAccentColor = accentColor || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "transparent" }}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.95 : 1,
          borderRadius: 24,
        },
      ]}
    >
      <Card style={{ ...styles.card, borderColor: colors.border }}>
        <View style={styles.row}>
          {icon && (
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: `${actualAccentColor}15` },
              ]}
            >
              <Feather name={icon as any} size={20} color={actualAccentColor} />
            </View>
          )}

          <View style={styles.textBlock}>
            <AppText weight="700" variant="body">
              {title}
            </AppText>
            {subtitle && (
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={styles.subtitle}
              >
                {subtitle}
              </AppText>
            )}
          </View>

          <View
            style={[
              styles.arrowWrapper,
              { backgroundColor: `${actualAccentColor}12` },
            ]}
          >
            <Feather
              name="arrow-right"
              size={15}
              color={actualAccentColor}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  arrowWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
});
