import React, { useState } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { ANNOUNCEMENT_TYPE, ANNOUNCEMENT_STATUS } from "../announcement.types";

export interface AnnouncementUiFilters {
  search?: string;
  category?: string;
  status?: string;
  date?: string;
  month?: string;
  year?: string;
}

interface Props {
  filters: AnnouncementUiFilters;
  onFiltersChange: (newFilters: AnnouncementUiFilters) => void;
  isAdmin?: boolean;
}

export default function AnnouncementFilterBar({
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

  const categories = Object.values(ANNOUNCEMENT_TYPE);
  const statuses = Object.values(ANNOUNCEMENT_STATUS);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleCategorySelect = (cat: string) => {
    onFiltersChange({ ...filters, category: cat || undefined });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({ ...filters, status: status || undefined });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const openCategorySheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Categories", onPress: () => handleCategorySelect("") },
      ...categories.map((c) => ({
        label: c,
        onPress: () => handleCategorySelect(c),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Category", options });
  };



  const activeFilterCount = [
    filters.category,
    isAdmin && filters.status,
    filters.date,
    filters.month,
    filters.year,
    Boolean(filters.search?.trim()),
  ].filter(Boolean).length;

  const quickChips = isAdmin ? (
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
  ) : (
    <>
      <FilterChip
        label="All Categories"
        isSelected={!filters.category}
        onPress={() => handleCategorySelect("")}
      />
      {categories.map((c) => {
        const isSelected = filters.category === c;
        return (
          <FilterChip
            key={c}
            label={c}
            isSelected={isSelected}
            onPress={() => handleCategorySelect(c)}
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
            label="Category"
            placeholder="All Categories"
            value={filters.category || ""}
            onPress={openCategorySheet}
            onClear={() => handleCategorySelect("")}
            style={{ flex: 1 }}
          />
          <DatePickerField
            label="Publish Date Filter"
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
          <DropdownField
            label="Category"
            placeholder="All Categories"
            value={filters.category || ""}
            onPress={openCategorySheet}
            onClear={() => handleCategorySelect("")}
            style={{ flex: 1 }}
          />
          <DatePickerField
            label="Publish Date Filter"
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
        searchPlaceholder="Search title, message..."
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
