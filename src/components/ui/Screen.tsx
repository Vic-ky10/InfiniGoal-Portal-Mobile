import { ReactNode } from "react";
import {
  ScrollView,
  RefreshControl,
  useColorScheme,
  ViewStyle,
  StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdminColors,
  spacing,
} from "@/theme";
import Loader from "./Loader";
import ErrorState from "../common/ErrorState";

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
}: ScreenProps) {
  const colors = getAdminColors(useColorScheme());

  if (isLoading) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]}>
        <Loader />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]}>
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </SafeAreaView>
    );
  }

  if (scroll) {
    return (
      <SafeAreaView
        style={[
          {
            flex: 1,
            backgroundColor: colors.background,
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
          backgroundColor: colors.background,
          padding: spacing.xl,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
