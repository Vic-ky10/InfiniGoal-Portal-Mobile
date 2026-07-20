import { View } from "react-native";

import { spacing } from "@/theme";
import AppText from "../ui/AppText";

interface Props {
  title: string;
}

export default function EmptyState({
  title,
}: Props) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.massive,
      }}
    >
      <AppText>{title}</AppText>
    </View>
  );
}