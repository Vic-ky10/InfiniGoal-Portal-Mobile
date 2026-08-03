import "@/global.css";
import { Stack } from "expo-router";
import { Platform } from "react-native";

import {
  AuthProvider,
  QueryProvider,
  ThemeProvider,
} from "@/providers";
import { ToastContainer } from "@/components/common";
import { useEffect } from "react";



export default function RootLayout() {

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const style = document.createElement("style");

    style.textContent = `
      *:focus,
      *:active,
      *:hover,
      *:focus-visible,
      [role="button"]:focus,
      [role="button"]:focus-visible,
      [role="button"]:active,
      [role="button"]:hover,
      [tabindex]:focus,
      [tabindex]:focus-visible,
      [tabindex]:active,
      [tabindex]:hover {
        outline: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}