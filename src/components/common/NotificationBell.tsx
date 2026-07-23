import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";

interface NotificationBellProps {
  count: number;
}

export default function NotificationBell({
  count,
}: NotificationBellProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/(admin)/notifications")}
      style={{
        width: 46,
        height: 46,
        borderRadius: radius.full,
        backgroundColor: adminColors.surface,
        justifyContent: "center",
        alignItems: "center",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 3,
        },
        elevation: 3,
      }}
    >
      <Feather
        name="bell"
        size={22}
        color={adminColors.text}
      />

      {count > 0 && (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 4,

            minWidth: 18,
            height: 18,

            paddingHorizontal: 4,

            borderRadius: radius.full,

            backgroundColor: adminColors.danger,

            borderWidth: 2,
            borderColor: "#fff",

            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AppText
            variant="caption"
            weight="700"
            color="#fff"
          >
            {count > 99 ? "99+" : count}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}