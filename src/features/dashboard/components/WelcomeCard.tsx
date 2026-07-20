import { View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { adminColors, spacing } from "@/theme";

interface Props {
  name: string;
}

export default function WelcomeCard({
  name,
}: Props) {
  return (
    <Card>
      <AppText
        variant="caption"
        color={adminColors.textSecondary}
      >
        Welcome Back 👋
      </AppText>

      <AppText
        variant="h2"
        weight="700"
        style={{ marginTop: spacing.sm }}
      >
        {name}
      </AppText>

      <AppText
        color={adminColors.textSecondary}
        style={{ marginTop: spacing.sm }}
      >
        Have a productive day.
      </AppText>
    </Card>
  );
}