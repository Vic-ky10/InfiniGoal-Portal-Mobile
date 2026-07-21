import { ReactNode } from "react";
import {
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";

import {
  getAdminColors,
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
  const colors = getAdminColors(useColorScheme());

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
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
