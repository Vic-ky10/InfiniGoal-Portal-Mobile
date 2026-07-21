import { View, Image } from "react-native";
import { adminColors, radius, sizes } from "@/theme";
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
  const initials = name
    .split(" ")
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
        backgroundColor: adminColors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText color="#FFFFFF" weight="700" style={{ fontSize: size * 0.4 }}>
        {initials}
      </AppText>
    </View>
  );
}