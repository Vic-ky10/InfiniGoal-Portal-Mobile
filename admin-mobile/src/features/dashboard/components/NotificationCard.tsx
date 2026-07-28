import { Card, AppText } from "@/components/ui";
import { adminColors, shadows } from "@/theme";

interface Props {
  title: string;
}

export default function NotificationCard({
  title,
}: Props) {
  return (
    <Card
      style={{
        borderLeftWidth: 6,
        borderLeftColor: adminColors.primary,
        borderWidth: 0,
        backgroundColor: `${adminColors.primary}05`,
        ...shadows.sm,
      }}
    >
      <AppText
        weight="700"
        color={adminColors.primary}
        variant="body"
      >
        🔔 {title}
      </AppText>
    </Card>
  );
}