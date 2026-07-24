import { View } from "react-native";
import AppText from "./AppText";
import { useThemeColors, radius, spacing } from "@/theme";

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  variant?: "solid" | "subtle";
}

export default function Badge({
  label,
  color,
  textColor,
  variant = "subtle",
}: BadgeProps) {
  const colors = useThemeColors();
  const activeColor = color ?? colors.primary;
  const isSubtle = variant === "subtle";
  const bgColor = isSubtle ? `${activeColor}1A` : activeColor;
  const finalTextColor = textColor ?? (isSubtle ? activeColor : "#FFFFFF");

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bgColor,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        borderWidth: isSubtle ? 1 : 0,
        borderColor: `${activeColor}33`,
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