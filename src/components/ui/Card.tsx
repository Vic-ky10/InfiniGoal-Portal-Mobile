import { ReactNode } from "react";
import {
  View,
  ViewStyle,
} from "react-native";

import {
  useThemeColors,
  radius,
  shadows,
  spacing,
} from "@/theme";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export default function Card({
  children,
  style,
}: CardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: spacing.xl,
          ...shadows.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
