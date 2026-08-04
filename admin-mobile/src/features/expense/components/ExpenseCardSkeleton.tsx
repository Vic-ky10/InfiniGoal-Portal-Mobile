import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useThemeColors, radius, spacing, shadows } from "@/theme";

export default function ExpenseCardSkeleton() {
  const colors = useThemeColors();
  const animatedValue = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  return (
    <View
      style={[
        styles.skeletonCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <Animated.View
          style={[styles.iconPlaceholder, { backgroundColor: colors.border, opacity: animatedValue }]}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <Animated.View
            style={[styles.lineShort, { backgroundColor: colors.border, opacity: animatedValue }]}
          />
          <Animated.View
            style={[styles.lineTiny, { backgroundColor: colors.border, opacity: animatedValue }]}
          />
        </View>
        <Animated.View
          style={[styles.badgePlaceholder, { backgroundColor: colors.border, opacity: animatedValue }]}
        />
      </View>

      <Animated.View
        style={[styles.lineLarge, { backgroundColor: colors.border, opacity: animatedValue, marginVertical: spacing.sm }]}
      />

      <View style={styles.footerRow}>
        <Animated.View
          style={[styles.lineTiny, { width: 100, backgroundColor: colors.border, opacity: animatedValue }]}
        />
        <Animated.View
          style={[styles.badgePlaceholder, { width: 60, backgroundColor: colors.border, opacity: animatedValue }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
  },
  badgePlaceholder: {
    width: 70,
    height: 22,
    borderRadius: radius.full,
  },
  lineShort: {
    width: 140,
    height: 16,
    borderRadius: radius.xs,
  },
  lineTiny: {
    width: 90,
    height: 12,
    borderRadius: radius.xs,
  },
  lineLarge: {
    width: 120,
    height: 24,
    borderRadius: radius.xs,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: spacing.sm,
  },
});
