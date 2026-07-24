import { View, Image } from "react-native";
import { useThemeColors, radius, sizes } from "@/theme";
import AppText from "./AppText";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export default function Avatar({
  uri,
  name = "User",
  size = sizes.avatarMedium,
}: AvatarProps) {
  const colors = useThemeColors();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: colors.border,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.background,
      }}
    >
      <AppText color="#FFFFFF" weight="700" style={{ fontSize: size * 0.38 }}>
        {initials}
      </AppText>
    </View>
  );
}