import {
  ActivityIndicator,
  View,
  useColorScheme,
} from "react-native";

import { useThemeColors, spacing } from "@/theme";

export default function Loader() {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
      }}
    >
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />
    </View>
  );
}
