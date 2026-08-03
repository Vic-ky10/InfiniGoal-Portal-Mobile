import { supabase } from "@/lib/supabase/client";
import { IncentiveRule } from "./sales.types";
import { IncentiveRuleForm } from "./sales.validation";
import { ServiceResponse } from "./customer.service";

const INCENTIVE_RULE_SELECT =
  "id, minimum_purchase, incentive_amount, status, created_by, created_at, updated_at";

export async function getIncentiveRules(): Promise<IncentiveRule[]> {
  const { data, error } = await supabase
    .from("incentive_rules")
    .select(INCENTIVE_RULE_SELECT)
    .order("minimum_purchase", { ascending: true });

  if (error) {
    console.error("Get Incentive Rules Error:", error.message);
    return [];
  }

  return data as IncentiveRule[];
}

export async function getIncentiveRuleById(id: string): Promise<IncentiveRule | null> {
  const { data, error } = await supabase
    .from("incentive_rules")
    .select(INCENTIVE_RULE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get Incentive Rule Error:", error.message);
    return null;
  }

  return data as IncentiveRule | null;
}

export async function createIncentiveRule(
  rule: IncentiveRuleForm,
  createdBy: string
): Promise<ServiceResponse<IncentiveRule>> {
  const { data, error } = await supabase
    .from("incentive_rules")
    .insert({
      minimum_purchase: rule.minimum_purchase,
      incentive_amount: rule.incentive_amount,
      status: rule.status,
      created_by: createdBy,
    })
    .select(INCENTIVE_RULE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Incentive rule created successfully.",
    data: data as IncentiveRule,
  };
}

export async function updateIncentiveRule(
  id: string,
  rule: IncentiveRuleForm
): Promise<ServiceResponse<IncentiveRule>> {
  const { data, error } = await supabase
    .from("incentive_rules")
    .update({
      minimum_purchase: rule.minimum_purchase,
      incentive_amount: rule.incentive_amount,
      status: rule.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(INCENTIVE_RULE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Incentive rule updated successfully.",
    data: data as IncentiveRule,
  };
}

export async function deleteIncentiveRule(id: string): Promise<ServiceResponse> {
  const { error } = await supabase
    .from("incentive_rules")
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
    message: "Incentive rule deleted successfully.",
  };
}
