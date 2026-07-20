import { View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { spacing } from "@/theme";

interface Props {
  title: string;
  time: string;
}

export default function RecentActivity({
  title,
  time,
}: Props) {
  return (
    <Card>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <AppText weight="600">
          {title}
        </AppText>

        <AppText
          variant="caption"
        >
          {time}
        </AppText>
      </View>
    </Card>
  );
}