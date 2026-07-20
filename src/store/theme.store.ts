import { create } from "zustand";

type ThemeMode = "admin" | "employee";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "admin",

  setMode: (mode) => set({ mode }),
}));