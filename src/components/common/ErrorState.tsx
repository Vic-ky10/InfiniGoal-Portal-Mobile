import { View } from "react-native";

import { adminColors, spacing } from "@/theme";
import AppText from "../ui/AppText";

interface Props {
  message: string;
}

export default function ErrorState({
  message,
}: Props) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.massive,
      }}
    >
      <AppText color={adminColors.danger}>
        {message}
      </AppText>
    </View>
  );
}