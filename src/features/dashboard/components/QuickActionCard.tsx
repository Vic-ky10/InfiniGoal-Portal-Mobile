import { TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
}

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon && (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: adminColors.background,
                marginRight: spacing.md,
              }}
            >
              <Feather name={icon} size={20} color={adminColors.primary} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <AppText weight="600" variant="body">
              {title}
            </AppText>
            {subtitle && (
              <AppText variant="caption" color={adminColors.textSecondary}>
                {subtitle}
              </AppText>
            )}
          </View>

          <Feather name="chevron-right" size={20} color={adminColors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}