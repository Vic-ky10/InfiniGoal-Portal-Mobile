import { useQuery } from "@tanstack/react-query";
import {
  getMyCustomers,
  getMyCustomerPurchases,
  getMySalesAreas,
  getEmployeeSalesDashboardData,
} from "../employee-sales.service";

export function useMyCustomers(profileId: string) {
  return useQuery({
    queryKey: ["my-customers", profileId],
    queryFn: () => getMyCustomers(profileId),
    enabled: !!profileId,
  });
}

export function useMyCustomerPurchases(profileId: string) {
  return useQuery({
    queryKey: ["my-purchases", profileId],
    queryFn: () => getMyCustomerPurchases(profileId),
    enabled: !!profileId,
  });
}

export function useMySalesAreas(profileId: string) {
  return useQuery({
    queryKey: ["my-sales-areas", profileId],
    queryFn: () => getMySalesAreas(profileId),
    enabled: !!profileId,
  });
}

export function useEmployeeSalesDashboardData(profileId: string) {
  return useQuery({
    queryKey: ["my-sales-dashboard", profileId],
    queryFn: () => getEmployeeSalesDashboardData(profileId),
    enabled: !!profileId,
  });
}
