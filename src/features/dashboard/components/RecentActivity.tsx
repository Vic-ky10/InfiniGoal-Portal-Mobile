import { View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { adminColors, spacing, shadows } from "@/theme";

interface Props {
  title: string;
  time: string;
}

export default function RecentActivity({
  title,
  time,
}: Props) {
  return (
    <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <AppText weight="700" variant="body">
          {title}
        </AppText>

        <AppText
          variant="caption"
          color={adminColors.textSecondary}
        >
          {time}
        </AppText>
      </View>
    </Card>
  );
}