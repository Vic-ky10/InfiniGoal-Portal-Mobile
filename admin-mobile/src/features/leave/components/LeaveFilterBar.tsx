import React, { useState, useMemo } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { LeaveFilters, LEAVE_STATUS, LEAVE_TYPE } from "../leave.types";
import { DEPARTMENTS } from "@/features/employee/employee.constants";

interface Props {
  filters: LeaveFilters;
  onFiltersChange: (newFilters: LeaveFilters) => void;
  isAdmin?: boolean;
  leaves?: any[];
}

export default function LeaveFilterBar({
  filters,
  onFiltersChange,
  isAdmin = false,
  leaves = [],
}: Props) {
  const colors = useThemeColors();
  const [sheetConfig, setSheetConfig] = useState<{
    visible: boolean;
    title: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    title: "",
    options: [],
  });

  const statuses = Object.values(LEAVE_STATUS);
  const leaveTypes = Object.values(LEAVE_TYPE);
  const departments = DEPARTMENTS;

  const employeesList = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    leaves.forEach((l) => {
      if (l.employee && !list.some((x) => x.id === l.profile_id)) {
        list.push({ id: l.profile_id, name: l.employee.full_name });
      }
    });
    return list;
  }, [leaves]);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as any,
    });
  };

  const handleLeaveTypeSelect = (type: string) => {
    onFiltersChange({
      ...filters,
      leaveType: type as any,
    });
  };

  const handleDepartmentSelect = (dept: string) => {
    onFiltersChange({
      ...filters,
      department: dept,
    });
  };

  const handleEmployeeSelect = (profileId: string) => {
    onFiltersChange({
      ...filters,
      profileId: profileId || undefined,
    });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const openLeaveTypeSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Leave Types", onPress: () => handleLeaveTypeSelect("") },
      ...leaveTypes.map((type) => ({
        label: type,
        onPress: () => handleLeaveTypeSelect(type),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Leave Type", options });
  };

  const openDepartmentSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Departments", onPress: () => handleDepartmentSelect("") },
      ...departments.map((dept) => ({
        label: dept,
        onPress: () => handleDepartmentSelect(dept),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Department", options });
  };

  const openEmployeeSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Employees", onPress: () => handleEmployeeSelect("") },
      ...employeesList.map((emp) => ({
        label: emp.name,
        onPress: () => handleEmployeeSelect(emp.id),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Employee", options });
  };

  const selectedEmployeeName = useMemo(() => {
    if (!filters.profileId) return "";
    return employeesList.find((e) => e.id === filters.profileId)?.name || "";
  }, [filters.profileId, employeesList]);



  const activeFilterCount = [
    filters.status,
    filters.leaveType,
    filters.date,
    filters.month,
    filters.year,
    isAdmin && filters.department,
    isAdmin && filters.profileId,
    filters.search,
  ].filter(Boolean).length;

  const quickChips = (
    <>
      <FilterChip
        label="All Status"
        isSelected={!filters.status}
        onPress={() => handleStatusSelect("")}
      />
      {statuses.map((st) => {
        const isSelected = filters.status === st;
        return (
          <FilterChip
            key={st}
            label={st}
            isSelected={isSelected}
            onPress={() => handleStatusSelect(st)}
          />
        );
      })}
    </>
  );

  const expandedContent = (
    <View style={{ gap: spacing.md }}>
      {isAdmin ? (
        <>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <DropdownField
              label="Employee"
              placeholder="All Employees"
              value={selectedEmployeeName}
              onPress={openEmployeeSheet}
              onClear={() => handleEmployeeSelect("")}
              style={{ flex: 1 }}
            />
            <DropdownField
              label="Department"
              placeholder="All Departments"
              value={filters.department}
              onPress={openDepartmentSheet}
              onClear={() => handleDepartmentSelect("")}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <DropdownField
              label="Leave Type"
              placeholder="All Leave Types"
              value={filters.leaveType || ""}
              onPress={openLeaveTypeSheet}
              onClear={() => handleLeaveTypeSelect("")}
              style={{ flex: 1 }}
            />
            <DatePickerField
              label="Date Filter"
              placeholder="Select Date"
              value={filters.date}
              mode="date"
              onChange={(val) => onFiltersChange({ ...filters, date: val })}
              onClear={() => onFiltersChange({ ...filters, date: undefined })}
              style={{ flex: 1, marginBottom: 0 }}
            />
          </View>
        </>
      ) : (
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <DropdownField
            label="Leave Type"
            placeholder="All Leave Types"
            value={filters.leaveType || ""}
            onPress={openLeaveTypeSheet}
            onClear={() => handleLeaveTypeSelect("")}
            style={{ flex: 1 }}
          />
          <DatePickerField
            label="Date Filter"
            placeholder="Select Date"
            value={filters.date}
            mode="date"
            onChange={(val) => onFiltersChange({ ...filters, date: val })}
            onClear={() => onFiltersChange({ ...filters, date: undefined })}
            style={{ flex: 1, marginBottom: 0 }}
          />
        </View>
      )}
    </View>
  );

  return (
    <>
      <BaseFilterBar
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={isAdmin ? "Search employee name or ID..." : "Search reason, type..."}
        activeFilterCount={activeFilterCount}
        quickChips={quickChips}
        expandedContent={expandedContent}
        onReset={handleReset}
      />

      <ActionSheet
        visible={sheetConfig.visible}
        onClose={() => setSheetConfig((prev) => ({ ...prev, visible: false }))}
        title={sheetConfig.title}
        options={sheetConfig.options}
      />
    </>
  );
}
