import { useMemo } from "react";
import { Animated, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Avatar, Badge } from "@/components/ui";
import { useThemeColors, spacing, shadows } from "@/theme";
import { Employee } from "../employee.types";

interface Props {
  employee: Employee;
  onPress: () => void;
}

export default function EmployeeCard({
  employee,
  onPress,
}: Props) {
  const colors = useThemeColors();
  const isActive = employee.status === "Active";
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Card style={{ borderWidth: 1, borderColor: colors.border, ...shadows.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar
              uri={employee.avatar_url}
              name={employee.full_name}
              size={48}
            />

            <View style={{ flex: 1, marginLeft: spacing.md, gap: spacing.xs }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <AppText weight="700" variant="body" color={colors.text}>
                  {employee.full_name}
                </AppText>
                <Badge
                  label={employee.status}
                  color={isActive ? colors.success : colors.disabled}
                />
              </View>

              <AppText variant="caption" color={colors.textSecondary}>
                {employee.designation || employee.role}
              </AppText>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.xs }}>
                <Feather name="briefcase" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <AppText variant="caption" color={colors.textSecondary}>
                  {employee.department ?? "Unassigned"}
                </AppText>
              </View>
            </View>

            <Feather name="chevron-right" size={16} color={colors.textSecondary} style={{ marginLeft: spacing.xs }} />
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
