import React, { useState } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { ExpenseFilters, EXPENSE_CATEGORY } from "../expense.types";

interface Props {
  filters: ExpenseFilters;
  onFiltersChange: (newFilters: ExpenseFilters) => void;
}

export default function ExpenseFilterBar({
  filters,
  onFiltersChange,
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

  const statuses = ["Pending", "Approved", "Rejected"];
  const categories = Object.values(EXPENSE_CATEGORY);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, searchQuery: text });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status ? (status as any) : undefined,
    });
  };

  const handleCategorySelect = (cat: string) => {
    onFiltersChange({
      ...filters,
      category: cat ? (cat as any) : undefined,
    });
  };

  const handleReceiptSelect = (val: boolean | null) => {
    onFiltersChange({
      ...filters,
      hasReceipt: val,
    });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const openCategorySheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Expense Types", onPress: () => handleCategorySelect("") },
      ...categories.map((cat) => ({
        label: cat,
        onPress: () => handleCategorySelect(cat),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Expense Type", options });
  };

  const openReceiptSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Receipts", onPress: () => handleReceiptSelect(null) },
      { label: "📎 Has Receipt", onPress: () => handleReceiptSelect(true) },
      { label: "No Receipt", onPress: () => handleReceiptSelect(false) },
    ];
    setSheetConfig({ visible: true, title: "Select Receipt Attachment", options });
  };



  const activeFilterCount = [
    filters.status && filters.status !== "All",
    filters.category && filters.category !== "All",
    filters.hasReceipt !== undefined && filters.hasReceipt !== null,
    filters.date,
    filters.month,
    filters.year,
    Boolean(filters.searchQuery?.trim()),
  ].filter(Boolean).length;

  const quickChips = (
    <>
      <FilterChip
        label="All Status"
        isSelected={!filters.status || filters.status === "All"}
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

  const selectedReceiptLabel = () => {
    if (filters.hasReceipt === true) return "📎 Has Receipt";
    if (filters.hasReceipt === false) return "No Receipt";
    return "";
  };

  const expandedContent = (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <DropdownField
          label="Expense Type"
          placeholder="All Expense Types"
          value={(filters.category && filters.category !== "All" ? filters.category : "") as string}
          onPress={openCategorySheet}
          onClear={() => handleCategorySelect("")}
          style={{ flex: 1 }}
        />
        <DropdownField
          label="Receipt Attachment"
          placeholder="All Receipts"
          value={selectedReceiptLabel()}
          onPress={openReceiptSheet}
          onClear={() => handleReceiptSelect(null)}
          style={{ flex: 1 }}
        />
      </View>
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
    </View>
  );

  return (
    <>
      <BaseFilterBar
        searchQuery={filters.searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search expense title, category, employee..."
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
