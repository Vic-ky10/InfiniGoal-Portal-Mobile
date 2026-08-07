import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";
import { EmployeeList } from "../components";
import { useEmployees } from "../hooks/useEmployees";
import { EMPLOYEE_STATUS, EMPLOYEE_ROLE, DEPARTMENTS } from "../employee.constants";

export default function EmployeeListScreen() {
  const router = useRouter();
  const { employees, loading, refreshing, refresh } = useEmployees();
  
  const [filters, setFilters] = useState<{
    search: string;
    status: string;
    department: string;
    role: string;
  }>({
    search: "",
    status: "",
    department: "",
    role: "",
  });

  const [sheetConfig, setSheetConfig] = useState<{
    visible: boolean;
    title: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    title: "",
    options: [],
  });

  const departments = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];
    return depts.length > 0 ? depts : Array.from(DEPARTMENTS);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !filters.search ||
        emp.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.department?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        !filters.status || emp.status === filters.status;

      const matchesDepartment = 
        !filters.department || emp.department === filters.department;

      const matchesRole =
        !filters.role || emp.role === filters.role;

      return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
    });
  }, [employees, filters]);

  const handleReset = () => {
    setFilters({
      search: "",
      status: "",
      department: "",
      role: "",
    });
  };

  const openDepartmentSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Departments", onPress: () => setFilters(prev => ({ ...prev, department: "" })) },
      ...departments.map((dept) => ({
        label: dept,
        onPress: () => setFilters(prev => ({ ...prev, department: dept })),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Department", options });
  };

  const openRoleSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Roles", onPress: () => setFilters(prev => ({ ...prev, role: "" })) },
      ...Object.values(EMPLOYEE_ROLE).map((role) => ({
        label: role,
        onPress: () => setFilters(prev => ({ ...prev, role: role })),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Role", options });
  };

  const activeFilterCount = [
    filters.status,
    filters.department,
    filters.role,
    filters.search,
  ].filter(Boolean).length;

  const quickChips = (
    <>
      <FilterChip
        label="All Status"
        isSelected={!filters.status}
        onPress={() => setFilters(prev => ({ ...prev, status: "" }))}
      />
      {Object.values(EMPLOYEE_STATUS).map((st) => {
        const isSelected = filters.status === st;
        return (
          <FilterChip
            key={st}
            label={st}
            isSelected={isSelected}
            onPress={() => setFilters(prev => ({ ...prev, status: st }))}
          />
        );
      })}
    </>
  );

  const expandedContent = (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <DropdownField
          label="Department"
          placeholder="All Departments"
          value={filters.department}
          onPress={openDepartmentSheet}
          onClear={() => setFilters(prev => ({ ...prev, department: "" }))}
          style={{ flex: 1 }}
        />
        <DropdownField
          label="Role"
          placeholder="All Roles"
          value={filters.role}
          onPress={openRoleSheet}
          onClear={() => setFilters(prev => ({ ...prev, role: "" }))}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Employees" subtitle={`${employees.length} total staff members`} />

        <BaseFilterBar
          searchQuery={filters.search}
          onSearchChange={(text) => setFilters(prev => ({ ...prev, search: text }))}
          searchPlaceholder="Search employees..."
          activeFilterCount={activeFilterCount}
          quickChips={quickChips}
          expandedContent={expandedContent}
          onReset={handleReset}
        />

        <EmployeeList
          employees={filteredEmployees}
          refreshing={refreshing}
          onRefresh={refresh}
          onSelect={(employee) =>
            router.push({
              pathname: "/(admin)/employees/[id]",
              params: { id: employee.id },
            })
          }
        />
      </View>

      <ActionSheet
        visible={sheetConfig.visible}
        onClose={() => setSheetConfig((prev) => ({ ...prev, visible: false }))}
        title={sheetConfig.title}
        options={sheetConfig.options}
      />
    </Screen>
  );
}
