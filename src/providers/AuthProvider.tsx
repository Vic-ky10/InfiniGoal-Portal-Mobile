import { ReactNode, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useSegments } from "expo-router";

import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const router = useRouter();
  const segments = useSegments();

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);

  const setIsInitializing = useAuthStore((state) => state.setIsInitializing);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (mounted && profile?.role) {
            setUser(session.user);
            setRole(profile.role);
            console.log("AUTH PROVIDER ROLE:", profile.role);
          } else if (mounted) {
            setUser(null);
            setRole(null);
          }
        } else if (mounted) {
          setUser(null);
          setRole(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const currentUser = useAuthStore.getState().user;
        const currentRole = useAuthStore.getState().role;
        if (currentUser?.id === session.user.id && currentRole) {
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (mounted && profile?.role) {
          setUser(session.user);
          setRole(profile.role);
        } else if (mounted) {
          setUser(null);
          setRole(null);
        }
      } else if (mounted) {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const group = segments[0] as string | undefined;
    const inAdminGroup = group === "(admin)";
    const inEmployeeGroup = group === "(employee)";
    const inAuthGroup = group === "(auth)";
    const isHome = !group || group === "index";

    if (!user || !role) {
      if (inAdminGroup || inEmployeeGroup) {
        router.replace("/");
      }
      return;
    }

    if (role === "Admin") {
      if (inEmployeeGroup || inAuthGroup || isHome) {
        router.replace("/(admin)/dashboard");
      }
    } else if (role === "Employee") {
      if (inAdminGroup || inAuthGroup || isHome) {
        router.replace("/(employee)/dashboard");
      }
    }
  }, [user, role, isInitializing, segments]);

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <>{children}</>;
}