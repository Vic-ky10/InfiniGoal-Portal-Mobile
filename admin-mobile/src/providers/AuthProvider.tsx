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
  const department = useAuthStore((state) => state.department);
  const setDepartment = useAuthStore((state) => state.setDepartment);

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
            .select("role, department")
            .eq("id", session.user.id)
            .single();

          if (mounted && profile?.role) {
            setUser(session.user);
            setRole(profile.role);
            setDepartment(profile.department || null);
            console.log("AUTH PROVIDER ROLE:", profile.role, "DEPT:", profile.department);
          } else if (mounted) {
            setUser(null);
            setRole(null);
            setDepartment(null);
          }
        } else if (mounted) {
          setUser(null);
          setRole(null);
          setDepartment(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setRole(null);
          setDepartment(null);
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
          .select("role, department")
          .eq("id", session.user.id)
          .single();

        if (mounted && profile?.role) {
          setUser(session.user);
          setRole(profile.role);
          setDepartment(profile.department || null);
        } else if (mounted) {
          setUser(null);
          setRole(null);
          setDepartment(null);
        }
      } else if (mounted) {
        setUser(null);
        setRole(null);
        setDepartment(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setIsInitializing, setRole, setDepartment, setUser]);

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

    const isAdmin = (role === "Admin" || role === "Super Admin") && department === "Administration";

    if (isAdmin) {
      if (inEmployeeGroup || inAuthGroup || isHome) {
        router.replace("/(admin)/dashboard");
      }
    } else {
      if (inAdminGroup || inAuthGroup || isHome) {
        router.replace("/(employee)/dashboard");
      }
    }
  }, [user, role, department, isInitializing, segments, router]);

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