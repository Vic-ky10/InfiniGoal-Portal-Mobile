import { useCallback, useEffect, useState } from "react";

import { Employee } from "../employee.types";
import { getEmployees } from "../employee.service";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getEmployees();

      setEmployees(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    refresh: fetchEmployees,
  };
}