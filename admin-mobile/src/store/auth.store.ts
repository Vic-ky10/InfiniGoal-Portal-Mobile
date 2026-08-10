import { create } from "zustand";

interface AuthState {
  user: any | null;
  role: string | null;
  department: string | null;
  isInitializing: boolean;
  setUser: (user: any) => void;
  setRole: (role: string | null) => void;
  setDepartment: (department: string | null) => void;
  setIsInitializing: (isInitializing: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  department: null,
  isInitializing: true,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setDepartment: (department) => set({ department }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),

  logout: () => set({ user: null, role: null, department: null, isInitializing: false }),
}));