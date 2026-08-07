import { useQuery } from "@tanstack/react-query";
import { getEmployeeExpenseSummary } from "../expense.service";

export function useEmployeeExpenseSummary() {
  return useQuery({
    queryKey: ["employee-expense-summary"],
    queryFn: () => getEmployeeExpenseSummary(),
  });
}
