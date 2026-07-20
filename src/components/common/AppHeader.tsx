import { View } from "react-native";

import { adminColors, spacing } from "@/theme";
import AppText from "../ui/AppText";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

export default function AppHeader({
  title,
  subtitle,
  rightComponent,
}: AppHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xl,
      }}
    >
      <View>
        <AppText
          variant="h2"
          weight="700"
          color={adminColors.text}
        >
          {title}
        </AppText>

        {subtitle && (
          <AppText
            color={adminColors.textSecondary}
          >
            {subtitle}
          </AppText>
        )}
      </View>

      {rightComponent}
    </View>
  );
}