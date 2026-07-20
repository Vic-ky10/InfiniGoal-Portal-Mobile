import { ActivityIndicator, View } from "react-native";

import { adminColors } from "@/theme";

export default function Loader() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator
        size="large"
        color={adminColors.primary}
      />
    </View>
  );
}