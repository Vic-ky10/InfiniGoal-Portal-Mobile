import { useMemo } from "react";
import { ActivityIndicator, Animated, Pressable } from "react-native";

import AppText from "./AppText";
import { useThemeColors, radius, spacing } from "@/theme";

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
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

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
    <Animated.View
      style={{
        width: "100%",
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            width: "100%",
            height: isSmall ? 36 : 52,
            backgroundColor: isFilled ? colors.primary : "transparent",
            borderWidth: isFilled ? 0 : 1.5,
            borderColor: colors.primary,
            borderRadius: radius.md,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: isSmall ? spacing.md : spacing.lg,
            opacity: disabled || loading ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isFilled ? "#FFFFFF" : colors.primary}
          />
        ) : (
          <AppText
            weight="700"
            style={{
              fontSize: isSmall ? 15 : 17,
            }}
            color={isFilled ? "#FFFFFF" : colors.primary}
          >
            {title}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}