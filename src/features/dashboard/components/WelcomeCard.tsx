import { View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { adminColors, spacing, shadows } from "@/theme";

interface Props {
  name: string;
}

export default function WelcomeCard({
  name,
}: Props) {
  return (
    <Card
      style={{
        borderLeftWidth: 6,
        borderLeftColor: adminColors.primary,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: adminColors.border,
        ...shadows.sm,
      }}
    >
      <AppText
        variant="caption"
        color={adminColors.textSecondary}
        weight="600"
      >
        Welcome Back 👋
      </AppText>

      <AppText
        variant="h2"
        weight="700"
        style={{ marginTop: spacing.xs }}
      >
        {name}
      </AppText>

      <AppText
        color={adminColors.textSecondary}
        style={{ marginTop: spacing.xs }}
        variant="body"
      >
        Have a productive day monitoring system stats.
      </AppText>
    </Card>
  );
}