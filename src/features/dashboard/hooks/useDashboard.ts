import { useQuery } from "@tanstack/react-query";

import { getDashboardStats } from "../dashboard.service";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
  });
}