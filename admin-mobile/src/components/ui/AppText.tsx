import { Text, TextProps } from "react-native";

import {
  adminColors,
  typography,
} from "@/theme";

interface AppTextProps extends TextProps {
  variant?:
    | "display"
    | "h1"
    | "h2"
    | "h3"
    | "title"
    | "body"
    | "caption";

  color?: string;
  weight?: "400" | "500" | "600" | "700";
}

const fontSizes = {
  display: typography.display,
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  title: typography.title,
  body: typography.body,
  caption: typography.caption,
};

export default function AppText({
  children,
  variant = "body",
  color = adminColors.text,
  weight = "400",
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: fontSizes[variant],
          color,
          fontWeight: weight,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}