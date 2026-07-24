import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
} from "react-native";

import AppText from "./AppText";

import {
  useThemeColors,
  radius,
  spacing,
} from "@/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "filled" | "outline";
  /** "sm" renders a compact button suitable for card actions. Default: "md" */
  size?: "sm" | "md";
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "filled",
  size = "md",
}: ButtonProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const isFilled = variant === "filled";
  const isSmall = size === "sm";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => ({
          backgroundColor: isFilled ? colors.primary : "transparent",
          borderWidth: isFilled ? 0 : 1.5,
          borderColor: colors.primary,
          paddingVertical: isSmall ? spacing.xs : spacing.lg,
          paddingHorizontal: isSmall ? spacing.md : undefined,
          borderRadius: radius.md,
          alignItems: "center",
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
          justifyContent: "center",
          minHeight: isSmall ? 34 : 52,
        })}
      >
        {loading ? (
          <ActivityIndicator color={isFilled ? "#ffffff" : colors.primary} size={isSmall ? "small" : "small"} />
        ) : (
          <AppText
            weight="700"
            variant={isSmall ? "caption" : "body"}
            color={isFilled ? "#ffffff" : colors.primary}
          >
            {title}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}