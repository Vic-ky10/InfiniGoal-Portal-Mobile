import React, { useState, useMemo } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { TaskFilters, TASK_STATUS, TASK_PRIORITY } from "../task.types";

interface Props {
  filters: TaskFilters;
  onFiltersChange: (newFilters: TaskFilters) => void;
  isAdmin?: boolean;
  projects?: { id: string; name: string }[];
  employees?: { id: string; name: string }[];
}

export default function TaskFilterBar({
  filters,
  onFiltersChange,
  isAdmin = false,
  projects = [],
  employees = [],
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

  const statuses = Object.values(TASK_STATUS);
  const priorities = Object.values(TASK_PRIORITY);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status || undefined,
    });
  };

  const handlePrioritySelect = (priority: string) => {
    onFiltersChange({
      ...filters,
      priority: priority || undefined,
    });
  };

  const handleProjectSelect = (projId: string) => {
    onFiltersChange({
      ...filters,
      projectId: projId || undefined,
    });
  };

  const handleEmployeeSelect = (empId: string) => {
    onFiltersChange({
      ...filters,
      profileId: empId || undefined,
    });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const openPrioritySheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Priorities", onPress: () => handlePrioritySelect("") },
      ...priorities.map((pr) => ({
        label: pr,
        onPress: () => handlePrioritySelect(pr),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Priority", options });
  };

  const openProjectSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Projects", onPress: () => handleProjectSelect("") },
      ...projects.map((p) => ({
        label: p.name,
        onPress: () => handleProjectSelect(p.id),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Project", options });
  };

  const openEmployeeSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Employees", onPress: () => handleEmployeeSelect("") },
      ...employees.map((e) => ({
        label: e.name,
        onPress: () => handleEmployeeSelect(e.id),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Assigned Employee", options });
  };

  const selectedProjectName = useMemo(() => {
    if (!filters.projectId) return "";
    return projects.find((p) => p.id === filters.projectId)?.name || "";
  }, [filters.projectId, projects]);

  const selectedEmployeeName = useMemo(() => {
    if (!filters.profileId) return "";
    return employees.find((e) => e.id === filters.profileId)?.name || "";
  }, [filters.profileId, employees]);



  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.projectId,
    filters.date,
    filters.month,
    filters.year,
    isAdmin && filters.profileId,
    Boolean(filters.search?.trim()),
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
    <View style={{ gap: spacing.sm }}>
      {isAdmin ? (
        <>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <DropdownField
              label="Assigned Employee"
              placeholder="All Employees"
              value={selectedEmployeeName}
              onPress={openEmployeeSheet}
              onClear={() => handleEmployeeSelect("")}
              style={{ flex: 1 }}
            />
            <DropdownField
              label="Project"
              placeholder="All Projects"
              value={selectedProjectName}
              onPress={openProjectSheet}
              onClear={() => handleProjectSelect("")}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <DropdownField
              label="Priority"
              placeholder="All Priorities"
              value={filters.priority || ""}
              onPress={openPrioritySheet}
              onClear={() => handlePrioritySelect("")}
              style={{ flex: 1 }}
            />
            <DatePickerField
              label="Due Date Filter"
              placeholder="Select Date"
              value={filters.date}
              mode="date"
              onChange={(val) => onFiltersChange({ ...filters, date: val })}
              onClear={() => onFiltersChange({ ...filters, date: undefined })}
              style={{ flex: 1 }}
            />
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <DropdownField
              label="Project"
              placeholder="All Projects"
              value={selectedProjectName}
              onPress={openProjectSheet}
              onClear={() => handleProjectSelect("")}
              style={{ flex: 1 }}
            />
            <DropdownField
              label="Priority"
              placeholder="All Priorities"
              value={filters.priority || ""}
              onPress={openPrioritySheet}
              onClear={() => handlePrioritySelect("")}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <DatePickerField
              label="Due Date Filter"
              placeholder="Select Date"
              value={filters.date}
              mode="date"
              onChange={(val) => onFiltersChange({ ...filters, date: val })}
              onClear={() => onFiltersChange({ ...filters, date: undefined })}
              style={{ flex: 1 }}
            />
            <View style={{ flex: 1 }} />
          </View>
        </>
      )}
    </View>
  );

  return (
    <>
      <BaseFilterBar
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={isAdmin ? "Search tasks..." : "Search your tasks..."}
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
