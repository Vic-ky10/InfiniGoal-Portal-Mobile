import { Stack } from "expo-router";

import {
  AuthProvider,
  QueryProvider,
  ThemeProvider,
} from "@/providers";

export default function RootLayout() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}