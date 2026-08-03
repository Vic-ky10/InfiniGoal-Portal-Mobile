import { supabase } from "@/lib/supabase/client";
import { CODE_PADDING, SALES_AREA_PREFIX } from "./sales.constants";
import { SalesArea } from "./sales.types";
import { SalesAreaForm } from "./sales.validation";
import { ServiceResponse } from "./customer.service";

const SALES_AREA_SELECT =
  "id, area_code, area_name, area_type, address, city, state, pincode, contact_person, contact_phone, notes, status, created_by, created_at, updated_at";

export async function getSalesAreas(): Promise<SalesArea[]> {
  const { data, error } = await supabase
    .from("sales_areas")
    .select(SALES_AREA_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Sales Areas Error:", error.message);
    return [];
  }

  return data as SalesArea[];
}

export async function getSalesAreaById(id: string): Promise<SalesArea | null> {
  const { data, error } = await supabase
    .from("sales_areas")
    .select(SALES_AREA_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get Sales Area Error:", error.message);
    return null;
  }

  return data as SalesArea | null;
}

export async function generateSalesAreaCode(): Promise<string> {
  const { data, error } = await supabase
    .from("sales_areas")
    .select("area_code")
    .like("area_code", `${SALES_AREA_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to generate sales area code: " + error.message);
  }

  if (!data?.area_code) {
    return formatSalesAreaCode(1);
  }

  const current = Number(data.area_code.replace(SALES_AREA_PREFIX, ""));

  if (Number.isNaN(current)) {
    throw new Error("Latest sales area code is invalid.");
  }

  return formatSalesAreaCode(current + 1);
}

function formatSalesAreaCode(value: number) {
  return `${SALES_AREA_PREFIX}${String(value).padStart(CODE_PADDING, "0")}`;
}

export async function createSalesArea(
  area: SalesAreaForm,
  createdBy: string
): Promise<ServiceResponse<SalesArea>> {
  try {
    const areaCode = await generateSalesAreaCode();

    const { data, error } = await supabase
      .from("sales_areas")
      .insert({
        area_code: areaCode,
        area_name: area.area_name,
        area_type: area.area_type,
        address: area.address || null,
        city: area.city || null,
        state: area.state || null,
        pincode: area.pincode || null,
        contact_person: area.contact_person || null,
        contact_phone: area.contact_phone || null,
        notes: area.notes || null,
        status: area.status,
        created_by: createdBy,
      })
      .select(SALES_AREA_SELECT)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Sales area created successfully.",
      data: data as SalesArea,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create sales area.",
    };
  }
}

export async function updateSalesArea(
  id: string,
  area: SalesAreaForm
): Promise<ServiceResponse<SalesArea>> {
  const { data, error } = await supabase
    .from("sales_areas")
    .update({
      area_name: area.area_name,
      area_type: area.area_type,
      address: area.address || null,
      city: area.city || null,
      state: area.state || null,
      pincode: area.pincode || null,
      contact_person: area.contact_person || null,
      contact_phone: area.contact_phone || null,
      notes: area.notes || null,
      status: area.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SALES_AREA_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Sales area updated successfully.",
    data: data as SalesArea,
  };
}

export async function deleteSalesArea(id: string): Promise<ServiceResponse> {
  const { error } = await supabase
    .from("sales_areas")
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
    message: "Sales area deleted successfully.",
  };
}
