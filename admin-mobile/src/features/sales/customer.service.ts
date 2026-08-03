import { supabase } from "@/lib/supabase/client";
import { CODE_PADDING, CUSTOMER_PREFIX } from "./sales.constants";
import { Customer } from "./sales.types";
import { CustomerForm } from "./sales.validation";

export interface ServiceResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

const CUSTOMER_SELECT =
  "id, customer_code, full_name, phone, alternate_phone, email, address, sales_area_id, assigned_employee_id, status, notes, created_by, created_at, updated_at";

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Customers Error:", error.message);
    return [];
  }

  return data as Customer[];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get Customer By ID Error:", error.message);
    return null;
  }

  return data as Customer | null;
}

export async function generateCustomerCode(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_next_customer_code");

  if (error) {
    throw new Error("Unable to generate customer code: " + error.message);
  }

  return data as string;
}

export async function createCustomer(
  customer: CustomerForm,
  createdBy: string
): Promise<ServiceResponse<Customer>> {
  try {
    const customerCode = await generateCustomerCode();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        customer_code: customerCode,
        full_name: customer.full_name,
        phone: customer.phone,
        alternate_phone: customer.alternate_phone || null,
        email: customer.email || null,
        address: customer.address || null,
        sales_area_id: customer.sales_area_id,
        assigned_employee_id: customer.assigned_employee_id,
        status: customer.status,
        notes: customer.notes || null,
        created_by: createdBy,
      })
      .select(CUSTOMER_SELECT)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Customer created successfully.",
      data: data as Customer,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create customer.",
    };
  }
}

export async function updateCustomer(
  id: string,
  customer: CustomerForm
): Promise<ServiceResponse<Customer>> {
  const { data, error } = await supabase
    .from("customers")
    .update({
      full_name: customer.full_name,
      phone: customer.phone,
      alternate_phone: customer.alternate_phone || null,
      email: customer.email || null,
      address: customer.address || null,
      sales_area_id: customer.sales_area_id,
      assigned_employee_id: customer.assigned_employee_id,
      status: customer.status,
      notes: customer.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(CUSTOMER_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Customer updated successfully.",
    data: data as Customer,
  };
}

export async function deleteCustomer(id: string): Promise<ServiceResponse> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Customer deleted successfully.",
  };
}

function formatCustomerCode(value: number) {
  return `${CUSTOMER_PREFIX}${String(value).padStart(CODE_PADDING, "0")}`;
}
