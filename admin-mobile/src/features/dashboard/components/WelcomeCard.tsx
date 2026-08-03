import { Image, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Card } from "@/components/ui";
import { adminColors, spacing, shadows } from "@/theme";

interface Props {
  name: string;
  designation?: string;
  avatarUrl?: string | null;
}

export default function WelcomeCard({
  name,
  designation = "Administrator",
  avatarUrl,
}: Props) {
  return (
<Card
  style={{
    borderLeftWidth: 5,
    borderLeftColor: adminColors.primary,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...shadows.sm,
  }}
>
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    {/* Left */}
    <View style={{ flex: 1 }}>
      <AppText
        variant="caption"
        weight="600"
        color={adminColors.textSecondary}
      >
        Welcome Back 👋
      </AppText>

      <AppText
        variant="h2"
        weight="700"
        style={{ marginTop: spacing.xs }}
      >
        {name}
      </AppText>

      {designation && (
        <AppText
          variant="body"
          color={adminColors.textSecondary}
          style={{ marginTop: 2 }}
        >
          {designation}
        </AppText>
      )}

      <AppText
        variant="caption"
        color={adminColors.textSecondary}
        style={{ marginTop: spacing.sm }}
      >
        Have a productive day monitoring system stats.
      </AppText>
    </View>

    {/* Profile Image */}
    <View
      style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: "hidden",
        backgroundColor: `${adminColors.primary}15`,
        borderWidth: 2,
        borderColor: adminColors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: spacing.lg,
      }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
      ) : (
        <Feather
          name="user"
          size={28}
          color={adminColors.primary}
        />
      )}

      {/* Online Indicator */}
      <View
        style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: adminColors.success,
          borderWidth: 2,
          borderColor: "#fff",
        }}
      />
    </View>
  </View>
</Card>
  );
}