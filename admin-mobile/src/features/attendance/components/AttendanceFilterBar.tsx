import React, { useState } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { AttendanceFilters, ATTENDANCE_STATUS } from "../attendance.types";
import { DEPARTMENTS } from "@/features/employee/employee.constants";

interface Props {
  filters: AttendanceFilters;
  onFiltersChange: (newFilters: AttendanceFilters) => void;
  isAdmin?: boolean;
}

export default function AttendanceFilterBar({
  filters,
  onFiltersChange,
  isAdmin = false,
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

  const statuses = Object.values(ATTENDANCE_STATUS);
  const departments = DEPARTMENTS;

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as any,
    });
  };

  const handleDepartmentSelect = (dept: string) => {
    onFiltersChange({
      ...filters,
      department: dept,
    });
  };

  const handleReset = () => {
    onFiltersChange({});
  };


  const openDepartmentSheet = () => {
    const options: ActionSheetOption[] = [
      {
        label: "All Departments",
        onPress: () => handleDepartmentSelect(""),
      },
      ...departments.map((dept) => ({
        label: dept,
        onPress: () => handleDepartmentSelect(dept),
      })),
    ];
    setSheetConfig({
      visible: true,
      title: "Select Department",
      options,
    });
  };



  const activeFilterCount = [
    filters.status,
    isAdmin && filters.department,
    filters.date,
    filters.month,
    filters.year,
    filters.search,
  ].filter(Boolean).length;

  const quickChips = (
    <>
      <FilterChip
        label="All"
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
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <DropdownField
            label="Department"
            placeholder="All Departments"
            value={filters.department}
            onPress={openDepartmentSheet}
            onClear={() => handleDepartmentSelect("")}
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
      ) : (
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <DatePickerField
            label="Date Filter"
            placeholder="Select Date"
            value={filters.date}
            mode="date"
            onChange={(val) => onFiltersChange({ ...filters, date: val })}
            onClear={() => onFiltersChange({ ...filters, date: undefined })}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <View style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );

  return (
    <>
      <BaseFilterBar
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={isAdmin ? "Search employee..." : "Search status..."}
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
