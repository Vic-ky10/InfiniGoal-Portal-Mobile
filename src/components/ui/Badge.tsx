import { View } from "react-native";

import AppText from "./AppText";

import {
  adminColors,
  radius,
  spacing,
} from "@/theme";

interface BadgeProps {
  label: string;
  color?: string;
}

export default function Badge({
  label,
  color = adminColors.success,
}: BadgeProps) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: color,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
      }}
    >
      <AppText
        color="#fff"
        weight="600"
      >
        {label}
      </AppText>
    </View>
  );
}