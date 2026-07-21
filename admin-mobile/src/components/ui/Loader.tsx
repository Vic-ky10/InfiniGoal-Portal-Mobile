import {
  ActivityIndicator,
  View,
  useColorScheme,
} from "react-native";

import { getAdminColors, spacing } from "@/theme";

export default function Loader() {
  const colors = getAdminColors(useColorScheme());

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
