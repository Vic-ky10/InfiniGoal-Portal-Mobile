import { ReactNode } from "react";
import { View } from "react-native";

import {
  adminColors,
  radius,
  shadows,
  spacing,
} from "@/theme";

interface CardProps {
  children: ReactNode;
}

export default function Card({
  children,
}: CardProps) {
  return (
    <View
      style={{
        backgroundColor: adminColors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        ...shadows.sm,
      }}
    >
      {children}
    </View>
  );
}