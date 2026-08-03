import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { adminColors, spacing } from "@/theme";
import AppText from "../ui/AppText";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  showMenuButton?: boolean;
  onBack?: () => void;
}

export default function AppHeader({
  title,
  subtitle,
  rightComponent,
  showMenuButton = true,
  onBack,
}: AppHeaderProps) {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    try {
      navigation.dispatch({ type: "TOGGLE_DRAWER" });
    } catch {
      // Fallback if not inside a drawer
    }
  };

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xl,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          marginRight: spacing.md,
        }}
      >
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={{ marginRight: spacing.md, padding: spacing.xs }}
          >
            <Feather name="arrow-left" size={22} color={adminColors.text} />
          </TouchableOpacity>
        ) : showMenuButton ? (
          <TouchableOpacity
            onPress={handleMenuPress}
            style={{ marginRight: spacing.md, padding: spacing.xs }}
          >
            <Feather name="menu" size={22} color={adminColors.text} />
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="h2"
            weight="700"
            color={adminColors.text}
            numberOfLines={1}
          >
            {title}
          </AppText>

          {subtitle && (
            <AppText
              color={adminColors.textSecondary}
              variant="caption"
              numberOfLines={1}
            >
              {subtitle}
            </AppText>
          )}
        </View>
      </View>

      {rightComponent && (
        <View
          style={{
            flexShrink: 0,
            alignSelf: "center",
          }}
        >
          {rightComponent}
        </View>
      )}
    </View>
  );
}