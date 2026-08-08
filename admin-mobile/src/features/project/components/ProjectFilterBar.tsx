import React, { useState } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { ProjectFilters, PROJECT_STATUS, PROJECT_PRIORITY } from "../project.types";

interface Props {
  filters: ProjectFilters;
  onFiltersChange: (newFilters: ProjectFilters) => void;
  isAdmin?: boolean;
}

export default function ProjectFilterBar({
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

  const statuses = Object.values(PROJECT_STATUS);
  const priorities = Object.values(PROJECT_PRIORITY);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status ? (status as any) : undefined,
    });
  };

  const handlePrioritySelect = (priority: string) => {
    onFiltersChange({
      ...filters,
      priority: priority ? (priority as any) : undefined,
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



  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.date,
    filters.month,
    filters.year,
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
    <View style={{ gap: spacing.md }}>
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
          label="Date Filter"
          placeholder="Select Date"
          value={filters.date}
          mode="date"
          onChange={(val) => onFiltersChange({ ...filters, date: val })}
          onClear={() => onFiltersChange({ ...filters, date: undefined })}
          style={{ flex: 1, marginBottom: 0 }}
        />
      </View>
    </View>
  );

  return (
    <>
      <BaseFilterBar
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={isAdmin ? "Search projects..." : "Search your projects..."}
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
