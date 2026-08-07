

import { supabase } from "@/lib/supabase/client";
import { Employee } from "./employee.types";

const EMPLOYEE_SELECT = `
id,
employee_id,
full_name,
email,
phone,
department,
designation,
role,
avatar_url,
status,
is_online,
last_login,
joined_date,
date_of_birth,
current_address,
qualification,
degree,
experience_years,
emergency_contact,
created_at,
updated_at
`;

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(EMPLOYEE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Employees:", error.message);
    return [];
  }

  return (data || []) as Employee[];
}

export async function getEmployeeById(
  employeeId: string
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(EMPLOYEE_SELECT)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    console.error("Get Employee:", error.message);
    return null;
  }

  return data as Employee;
}

export async function searchEmployees(
  keyword: string
): Promise<Employee[]> {
  const search = keyword.trim();

  if (!search) {
    return getEmployees();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(EMPLOYEE_SELECT)
    .or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Search Employees:", error.message);
    return [];
  }

  return data as Employee[];
}


export async function updateSelfProfile(
  profileId: string,
  values: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    date_of_birth?: string | null;
    current_address?: string | null;
    qualification?: string | null;
    degree?: string | null;
    experience_years?: number | null;
    emergency_contact?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: values.full_name,
      phone: values.phone,
      avatar_url: values.avatar_url,
      date_of_birth: values.date_of_birth,
      current_address: values.current_address,
      qualification: values.qualification,
      degree: values.degree,
      experience_years: values.experience_years,
      emergency_contact: values.emergency_contact,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select(EMPLOYEE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Profile updated successfully.",
    data: data as Employee,
  };
}

export async function updateEmployeeProfile(
  employeeId: string,
  values: {
    full_name: string;
    phone: string | null;
    department: string | null;
    designation: string | null;
    role: string;
  }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: values.full_name,
      phone: values.phone,
      department: values.department,
      designation: values.designation,
      role: values.role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .select(EMPLOYEE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Employee updated successfully.",
    data: data as Employee,
  };
}