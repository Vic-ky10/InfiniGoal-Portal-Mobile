import { View } from "react-native";

import { adminColors, spacing } from "@/theme";
import AppText from "../ui/AppText";
import Button from "../ui/Button";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message,
  onRetry,
}: Props) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.massive,
      }}
    >
      <AppText color={adminColors.danger} style={{ textAlign: "center", marginBottom: spacing.lg }}>
        {message}
      </AppText>
      {onRetry && (
        <View style={{ width: 140 }}>
          <Button title="Retry" onPress={onRetry} />
        </View>
      )}
    </View>
  );
}