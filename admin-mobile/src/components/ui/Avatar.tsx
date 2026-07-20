import { Image } from "react-native";

import { sizes } from "@/theme";

interface AvatarProps {
  uri: string;
}

export default function Avatar({
  uri,
}: AvatarProps) {
  return (
    <Image
      source={{ uri }}
      style={{
        width: sizes.avatarMedium,
        height: sizes.avatarMedium,
        borderRadius: sizes.avatarMedium / 2,
      }}
    />
  );
}