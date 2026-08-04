import { useQuery } from "@tanstack/react-query";
import { getEmployeeDashboardStats } from "../services/employeeDashboard.service";

export function useEmployeeDashboard(profileId: string) {
  return useQuery({
    queryKey: ["employee-dashboard", profileId],
    queryFn: () => getEmployeeDashboardStats(profileId),
    enabled: !!profileId,
  });
}
