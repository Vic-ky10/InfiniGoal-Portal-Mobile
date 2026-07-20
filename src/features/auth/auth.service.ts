import { supabase } from "@/lib/supabase/client";

async function authenticate(
  email: string,
  password: string
) {
  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (result.error) {
    return result;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await supabase.auth.signOut();

    return {
      data: {
        user: null,
        session: null,
      },
      error: {
        message: "Unable to verify user.",
      },
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    await supabase.auth.signOut();

    return {
      data: {
        user: null,
        session: null,
      },
      error: {
        message: "Profile not found.",
      },
    };
  }

  return {
    result,
    role: profile.role,
  };
}

export async function loginAdmin(
  email: string,
  password: string
) {
  const auth = await authenticate(
    email,
    password
  );

  if ("error" in auth) {
    return auth;
  }

  if (auth.role !== "Admin") {
    await supabase.auth.signOut();

    return {
      data: {
        user: null,
        session: null,
      },
      error: {
        message:
          "Only administrators can access this portal.",
      },
    };
  }

  return auth.result;
}

export async function loginEmployee(
  email: string,
  password: string
) {
  const auth = await authenticate(
    email,
    password
  );

  if ("error" in auth) {
    return auth;
  }

  if (auth.role !== "Employee") {
    await supabase.auth.signOut();

    return {
      data: {
        user: null,
        session: null,
      },
      error: {
        message:
          "Only employees can access this portal.",
      },
    };
  }

  return auth.result;
}

export async function logout() {
  return await supabase.auth.signOut();
}