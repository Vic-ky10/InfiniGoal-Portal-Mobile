import { ReactNode } from "react";
import {
  ScrollView,
  RefreshControl,
  ViewStyle,
  StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useThemeColors,
  spacing,
} from "@/theme";
import Loader from "./Loader";
import ErrorState from "../common/ErrorState";
import KeyboardScreen from "../layouts/KeyboardScreen";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAware?: boolean;
  keyboardVerticalOffset?: number;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

export default function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  isLoading = false,
  isError = false,
  errorMessage = "Something went wrong. Please try again.",
  onRetry,
  style,
  contentContainerStyle,
  keyboardAware = true,
  keyboardVerticalOffset,
  keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.surface }, style]}>
        <Loader />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.surface }, style]}>
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </SafeAreaView>
    );
  }

  if (keyboardAware) {
    return (
      <KeyboardScreen
        scroll={scroll}
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={style}
        contentContainerStyle={contentContainerStyle}
        keyboardVerticalOffset={keyboardVerticalOffset}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </KeyboardScreen>
    );
  }

  if (scroll) {
    return (
      <SafeAreaView
        style={[
          {
            flex: 1,
            backgroundColor: colors.surface,
          },
          style,
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            {
              padding: spacing.xl,
              paddingBottom: spacing.xxxl,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: colors.surface,
          padding: spacing.xl,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
