import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getSalesAreas,
  getActiveSalesAreas,
  getSalesAreaById,
  createSalesArea,
  updateSalesArea,
  deleteSalesArea,
} from "../sales-area.service";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../customer.service";

import {
  getCustomerPurchases,
  getCustomerPurchaseById,
  createCustomerPurchase,
  updateCustomerPurchase,
  deleteCustomerPurchase,
} from "../customer-purchase.service";

import {
  getCustomerFollowups,
  getCustomerFollowupById,
  createCustomerFollowup,
  updateCustomerFollowup,
  deleteCustomerFollowup,
} from "../customer-followup.service";

import {
  getIncentiveRules,
  getIncentiveRuleById,
  createIncentiveRule,
  updateIncentiveRule,
  deleteIncentiveRule,
} from "../incentive-rule.service";

import {
  CustomerFollowupForm,
  CustomerForm,
  CustomerPurchaseForm,
  IncentiveRuleForm,
  SalesAreaForm,
} from "../sales.validation";

export const salesKeys = {
  all: ["sales"] as const,

  areas: () => [...salesKeys.all, "areas"] as const,
  activeAreas: () => [...salesKeys.areas(), "active"] as const,
  area: (id: string) => [...salesKeys.areas(), id] as const,

  customers: () => [...salesKeys.all, "customers"] as const,
  customer: (id: string) => [...salesKeys.customers(), id] as const,

  purchases: () => [...salesKeys.all, "purchases"] as const,
  purchase: (id: string) => [...salesKeys.purchases(), id] as const,

  followups: () => [...salesKeys.all, "followups"] as const,
  followup: (id: string) => [...salesKeys.followups(), id] as const,

  incentiveRules: () => [...salesKeys.all, "incentive-rules"] as const,
  incentiveRule: (id: string) => [...salesKeys.incentiveRules(), id] as const,
};

// ── SALES AREAS HOOKS ──

export function useSalesAreas() {
  return useQuery({
    queryKey: salesKeys.areas(),
    queryFn: getSalesAreas,
  });
}

export function useActiveSalesAreas() {
  return useQuery({
    queryKey: salesKeys.activeAreas(),
    queryFn: getActiveSalesAreas,
  });
}

export function useSalesArea(id: string) {
  return useQuery({
    queryKey: salesKeys.area(id),
    queryFn: () => getSalesAreaById(id),
    enabled: !!id,
  });
}

export function useCreateSalesArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, createdBy }: { data: SalesAreaForm; createdBy: string }) =>
      createSalesArea(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.areas() });
      queryClient.invalidateQueries({ queryKey: ["my-sales-areas"] });
    },
  });
}

export function useUpdateSalesArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalesAreaForm }) =>
      updateSalesArea(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.areas() });
      queryClient.invalidateQueries({ queryKey: salesKeys.area(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["my-sales-areas"] });
    },
  });
}

export function useDeleteSalesArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSalesArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.areas() });
      queryClient.invalidateQueries({ queryKey: ["my-sales-areas"] });
    },
  });
}

// ── CUSTOMERS HOOKS ──

export function useCustomers() {
  return useQuery({
    queryKey: salesKeys.customers(),
    queryFn: getCustomers,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: salesKeys.customer(id),
    queryFn: () => getCustomerById(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, createdBy }: { data: CustomerForm; createdBy: string }) =>
      createCustomer(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.customers() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) =>
      updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.customers() });
      queryClient.invalidateQueries({ queryKey: salesKeys.customer(variables.id) });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.customers() });
    },
  });
}

// ── CUSTOMER PURCHASES HOOKS ──

export function useCustomerPurchases() {
  return useQuery({
    queryKey: salesKeys.purchases(),
    queryFn: getCustomerPurchases,
  });
}

export function useCustomerPurchase(id: string) {
  return useQuery({
    queryKey: salesKeys.purchase(id),
    queryFn: () => getCustomerPurchaseById(id),
    enabled: !!id,
  });
}

export function useCreateCustomerPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, createdBy }: { data: CustomerPurchaseForm; createdBy: string }) =>
      createCustomerPurchase(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.purchases() });
    },
  });
}

export function useUpdateCustomerPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      adminReviewedBy,
    }: {
      id: string;
      data: CustomerPurchaseForm & { status?: string; incentive_status?: string };
      adminReviewedBy?: string;
    }) => updateCustomerPurchase(id, data, adminReviewedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.purchases() });
      queryClient.invalidateQueries({ queryKey: salesKeys.purchase(variables.id) });
    },
  });
}

export function useDeleteCustomerPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomerPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.purchases() });
    },
  });
}

// ── CUSTOMER FOLLOWUPS HOOKS ──

export function useCustomerFollowups() {
  return useQuery({
    queryKey: salesKeys.followups(),
    queryFn: getCustomerFollowups,
  });
}

export function useCustomerFollowup(id: string) {
  return useQuery({
    queryKey: salesKeys.followup(id),
    queryFn: () => getCustomerFollowupById(id),
    enabled: !!id,
  });
}

export function useCreateCustomerFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, createdBy }: { data: CustomerFollowupForm; createdBy: string }) =>
      createCustomerFollowup(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.followups() });
    },
  });
}

export function useUpdateCustomerFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFollowupForm }) =>
      updateCustomerFollowup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.followups() });
      queryClient.invalidateQueries({ queryKey: salesKeys.followup(variables.id) });
    },
  });
}

export function useDeleteCustomerFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomerFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.followups() });
    },
  });
}

// ── INCENTIVE RULES HOOKS ──

export function useIncentiveRules() {
  return useQuery({
    queryKey: salesKeys.incentiveRules(),
    queryFn: getIncentiveRules,
  });
}

export function useIncentiveRule(id: string) {
  return useQuery({
    queryKey: salesKeys.incentiveRule(id),
    queryFn: () => getIncentiveRuleById(id),
    enabled: !!id,
  });
}

export function useCreateIncentiveRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, createdBy }: { data: IncentiveRuleForm; createdBy: string }) =>
      createIncentiveRule(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.incentiveRules() });
    },
  });
}

export function useUpdateIncentiveRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IncentiveRuleForm }) =>
      updateIncentiveRule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.incentiveRules() });
      queryClient.invalidateQueries({ queryKey: salesKeys.incentiveRule(variables.id) });
    },
  });
}

export function useDeleteIncentiveRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIncentiveRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.incentiveRules() });
    },
  });
}
