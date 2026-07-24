import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText } from "@/components/ui";
import { adminColors, radius } from "@/theme";

interface NotificationBellProps {
  count: number;
  /** Route to navigate to when pressed. Defaults to admin notifications. */
  route?: string;
  /** Surface background color for the button. Defaults to adminColors.surface. */
  surfaceColor?: string;
  /** Icon color. Defaults to adminColors.text. */
  iconColor?: string;
  /** Badge background color. Defaults to adminColors.danger. */
  badgeColor?: string;
}

export default function NotificationBell({
  count,
  route = "/(admin)/notifications",
  surfaceColor = adminColors.surface,
  iconColor = adminColors.text,
  badgeColor = adminColors.danger,
}: NotificationBellProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(route as any)}
      style={{
        width: 46,
        height: 46,
        borderRadius: radius.full,
        backgroundColor: surfaceColor,
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
        color={iconColor}
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

            backgroundColor: badgeColor,

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