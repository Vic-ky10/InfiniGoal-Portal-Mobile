import { useThemeStore } from "@/store/theme.store";

export const adminColors = {
  primary: "#2563EB",
  primaryLight: "#3B82F6",
  primaryDark: "#1D4ED8",

  secondary: "#60A5FA",

  background: "#FFFFFF",
  surface: "#F8FAFC",

  text: "#0F172A",
  textSecondary: "#64748B",

  border: "#E2E8F0",
  divider: "#CBD5E1",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#0EA5E9",

  disabled: "#94A3B8",
};

export const adminDarkColors = adminColors;

export function useThemeColors() {
  const mode = useThemeStore((state) => state.mode);
  return mode === "employee" ? employeeColors : adminColors;
}

export function getAdminColors(_colorScheme?: string | null) {
  try {
    const mode = useThemeStore.getState().mode;
    return mode === "employee" ? employeeColors : adminColors;
  } catch (e) {
    return adminColors;
  }
}

export const employeeColors = {
  primary: "#22C55E",
  primaryLight: "#4ADE80",
  primaryDark: "#16A34A",

  secondary: "#86EFAC",

  background: "#FFFFFF",
  surface: "#F8FAFC",

  text: "#0F172A",
  textSecondary: "#64748B",

  border: "#E2E8F0",
  divider: "#CBD5E1",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#0EA5E9",

  disabled: "#94A3B8",
};

export const commonColors = {
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};
