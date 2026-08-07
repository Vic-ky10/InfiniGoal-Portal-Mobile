import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  RefreshControl,
  ViewStyle,
  StyleProp,
  Platform,
  View,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";

import { useThemeColors, spacing } from "@/theme";

export interface KeyboardScreenProps {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  behavior?: "padding" | "height" | "position";
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  showsVerticalScrollIndicator?: boolean;
  edges?: Edge[];
  bounces?: boolean;
}

export default function KeyboardScreen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  keyboardVerticalOffset,
  behavior,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  edges,
  bounces = true,
}: KeyboardScreenProps) {
  const colors = useThemeColors();

  const defaultBehavior =
    behavior ?? (Platform.OS === "ios" ? "padding" : "height");
  const defaultOffset = keyboardVerticalOffset ?? 0;

  return (
    <SafeAreaView
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={defaultBehavior}
        keyboardVerticalOffset={defaultOffset}
      >
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              {
                padding: spacing.xl,
                paddingBottom: spacing.xxxl,
                flexGrow: 1,
              },
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            bounces={bounces}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, padding: spacing.xl }, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
