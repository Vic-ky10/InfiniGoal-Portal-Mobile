import { useState } from "react";
import { StyleProp, TextInput, TextInputProps, View, ViewStyle } from "react-native";

import { useThemeColors, radius, spacing } from "@/theme";
import AppText from "./AppText";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({
  label,
  error,
  style,
  onFocus,
  onBlur,
  containerStyle,
  ...props
}: InputProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <AppText
          weight="600"
          style={{ marginBottom: spacing.xs, fontSize: 13 }}
          color={colors.textSecondary}
        >
          {label}
        </AppText>
      )}

      <TextInput
        placeholderTextColor={colors.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            height: 52,
            borderWidth: 1.5,
            borderColor: error
              ? colors.danger
              : focused
              ? colors.primary
              : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: 15,
          },
          style,
        ]}
        {...props}
      />

      {error && (
        <AppText
          variant="caption"
          color={colors.danger}
          style={{ marginTop: spacing.xs }}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}