import { useAuthStore } from "@/store";

export const useProfile = () => {
  const { user } = useAuthStore();

  return user;
};