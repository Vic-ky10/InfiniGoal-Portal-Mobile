import { Image, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

import { AppText } from "@/components/ui";
import { adminColors, employeeColors, useThemeColors, spacing, shadows, radius } from "@/theme";

interface Props {
  name: string;
  designation?: string;
  avatarUrl?: string | null;
  portalName?: string;
  theme?: "admin" | "employee";
}

export default function WelcomeCard({
  name,
  designation = "Administrator",
  avatarUrl,
  portalName = "Admin Portal",
  theme,
}: Props) {
  const fallbackColors = useThemeColors();
  const colors = theme === "employee" ? employeeColors : theme === "admin" ? adminColors : fallbackColors;
  const firstName = name.trim().split(" ")[0] || "Admin";

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop
                offset="0%"
                stopColor={colors.primary}
                stopOpacity={1}
              />
              <Stop
                offset="100%"
                stopColor={colors.primaryLight ?? colors.primary}
                stopOpacity={1}
              />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#cardGrad)"
            rx={radius.xl}
            ry={radius.xl}
          />
        </Svg>
      </View>

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.inner}>
        <View style={styles.leftContent}>
          <View style={styles.badgeRow}>
            <View style={styles.activeDot} />
            <AppText
              variant="caption"
              weight="600"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {portalName}
            </AppText>
          </View>

          <AppText variant="h2" weight="700" style={styles.greeting}>
            Hello, {firstName}!
          </AppText>

          {designation ? (
            <AppText variant="body" style={styles.designation}>
              {designation}
            </AppText>
          ) : null}

          <AppText variant="caption" style={styles.subtext}>
            Have a productive day ahead
          </AppText>
        </View>

        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={30} color={colors.primary} />
            </View>
          )}
          <View style={styles.onlineIndicator} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
    ...shadows.md,
  },
  decorCircle1: {
    position: "absolute",
    top: -35,
    right: -35,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.07)",
    zIndex: 0,
  },
  decorCircle2: {
    position: "absolute",
    bottom: -25,
    right: 55,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    zIndex: 0,
  },
  inner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  leftContent: {
    flex: 1,
    paddingRight: spacing.md,
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  greeting: {
    color: "#FFFFFF",
    marginBottom: 2,
  },
  designation: {
    color: "rgba(255,255,255,0.78)",
    marginBottom: spacing.xs,
  },
  subtext: {
    color: "rgba(255,255,255,0.60)",
    marginTop: spacing.xs,
  },
  avatarWrapper: {
    position: "relative",
    zIndex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ADE80",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
});
