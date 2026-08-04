import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText, Button } from "@/components/ui";
import { useThemeColors, radius, spacing } from "@/theme";

interface Props {
  onCreatePress?: () => void;
  title?: string;
  message?: string;
}

export default function ExpenseEmptyState({
  onCreatePress,
  title = "No Expenses Found",
  message = "Submit your first expense to start tracking your reimbursements.",
}: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: `${colors.primary}12` }]}>
        <Feather name="file-text" size={32} color={colors.primary} />
      </View>

      <AppText weight="700" variant="h3" color={colors.text} style={{ marginTop: spacing.sm }}>
        {title}
      </AppText>

      <AppText
        variant="body"
        color={colors.textSecondary}
        style={{ textAlign: "center", marginTop: 4, maxWidth: 280, lineHeight: 20 }}
      >
        {message}
      </AppText>

      {onCreatePress ? (
        <View style={{ marginTop: spacing.md, width: "100%", maxWidth: 200 }}>
          <Button title="Create Expense" onPress={onCreatePress} size="md" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
