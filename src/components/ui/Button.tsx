import {
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import AppText from "./AppText";

import {
  adminColors,
  radius,
  spacing,
} from "@/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      onPress={onPress}
      style={{
        backgroundColor: adminColors.primary,
        paddingVertical: spacing.lg,
        borderRadius: radius.md,
        alignItems: "center",
        opacity: disabled || loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <AppText
          weight="700"
          color="#fff"
        >
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
}