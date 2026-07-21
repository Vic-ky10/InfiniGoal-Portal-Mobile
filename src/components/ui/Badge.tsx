import { View } from "react-native";
import AppText from "./AppText";
import { adminColors, radius, spacing } from "@/theme";

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  variant?: "solid" | "subtle";
}

export default function Badge({
  label,
  color = adminColors.primary,
  textColor,
  variant = "subtle",
}: BadgeProps) {
  const isSubtle = variant === "subtle";
  const bgColor = isSubtle ? `${color}1A` : color;
  const finalTextColor = textColor ?? (isSubtle ? color : "#FFFFFF");

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bgColor,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
      }}
    >
      <AppText
        color={finalTextColor}
        weight="600"
        variant="caption"
      >
        {label}
      </AppText>
    </View>
  );
}