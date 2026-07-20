import { TouchableOpacity } from "react-native";

import { Card, AppText } from "@/components/ui";

interface Props {
  title: string;
  onPress: () => void;
}

export default function QuickActionCard({
  title,
  onPress,
}: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card>
        <AppText
          weight="600"
          style={{ textAlign: "center" }}
        >
          {title}
        </AppText>
      </Card>
    </TouchableOpacity>
  );
}