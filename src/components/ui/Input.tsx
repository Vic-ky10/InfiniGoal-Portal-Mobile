import { TextInput, TextInputProps, View } from "react-native";

import { adminColors, radius, spacing } from "@/theme";
import AppText from "./AppText";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  style,
  ...props
}: InputProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label && (
        <AppText
          weight="600"
          style={{ marginBottom: spacing.sm }}
        >
          {label}
        </AppText>
      )}

      <TextInput
        placeholderTextColor={adminColors.textSecondary}
        style={[
          {
            height: 50,
            borderWidth: 1,
            borderColor: error
              ? adminColors.danger
              : adminColors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: adminColors.surface,
            color: adminColors.text,
          },
          style,
        ]}
        {...props}
      />

      {error && (
        <AppText
          variant="caption"
          color={adminColors.danger}
          style={{ marginTop: spacing.xs }}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}