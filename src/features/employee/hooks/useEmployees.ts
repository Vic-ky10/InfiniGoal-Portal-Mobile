import { useCallback, useEffect, useState } from "react";

import { Employee } from "../employee.types";
import {
  getEmployeeById,
  getEmployees,
} from "../employee.service";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getEmployees();

      setEmployees(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    refreshing,
    refresh: () => fetchEmployees(true),
  };
}

export function useEmployee(id?: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = useCallback(async () => {
    if (!id) {
      setEmployee(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getEmployeeById(id);

      setEmployee(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  return {
    employee,
    loading,
    refresh: fetchEmployee,
  };
}
