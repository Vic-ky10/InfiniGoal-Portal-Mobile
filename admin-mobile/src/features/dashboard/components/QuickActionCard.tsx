import { TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, radius, spacing, shadows } from "@/theme";

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
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={{ borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon && (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.md,
                backgroundColor: `${adminColors.primary}10`,
                justifyContent: "center",
                alignItems: "center",
                marginRight: spacing.md,
              }}
            >
              <Feather name={icon} size={20} color={adminColors.primary} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <AppText weight="700" variant="body">
              {title}
            </AppText>
            {subtitle && (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                {subtitle}
              </AppText>
            )}
          </View>

          <Feather name="chevron-right" size={16} color={adminColors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}