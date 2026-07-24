import { useQuery } from "@tanstack/react-query";
import { getAdminExpenseSummary } from "../expense.service";

export function useAdminExpenseSummary() {
  return useQuery({
    queryKey: ["admin-expense-summary"],
    queryFn: getAdminExpenseSummary,
  });
}
