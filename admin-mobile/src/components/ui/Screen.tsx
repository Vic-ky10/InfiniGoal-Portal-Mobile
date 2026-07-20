import { ReactNode } from "react";
import {
  SafeAreaView,
  ScrollView,
} from "react-native";

import {
  adminColors,
  spacing,
} from "@/theme";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
}

export default function Screen({
  children,
  scroll = true,
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: adminColors.background,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: adminColors.background,
        padding: spacing.lg,
      }}
    >
      {children}
    </SafeAreaView>
  );
}