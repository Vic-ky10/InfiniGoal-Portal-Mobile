import { Card, AppText } from "@/components/ui";
import { adminColors } from "@/theme";

interface Props {
  title: string;
}

export default function NotificationCard({
  title,
}: Props) {
  return (
    <Card>
      <AppText
        weight="600"
        color={adminColors.primary}
      >
        🔔 {title}
      </AppText>
    </Card>
  );
}