import React, { useState } from "react";
import { View } from "react-native";

import { DatePickerField } from "@/components/ui";
import { BaseFilterBar, FilterChip, DropdownField, ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { INCENTIVE_TYPE, INCENTIVE_STATUS, INCENTIVE_PAYMENT_STATUS } from "../incentive.types";

export interface IncentiveUiFilters {
  search?: string;
  type?: string;
  status?: string;
  paymentStatus?: string;
  date?: string;
  month?: string;
  year?: string;
}

interface Props {
  filters: IncentiveUiFilters;
  onFiltersChange: (newFilters: IncentiveUiFilters) => void;
  isAdmin?: boolean;
}

export default function IncentiveFilterBar({
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

  const types = Object.values(INCENTIVE_TYPE);
  const statuses = Object.values(INCENTIVE_STATUS);
  const paymentStatuses = Object.values(INCENTIVE_PAYMENT_STATUS);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleTypeSelect = (type: string) => {
    onFiltersChange({ ...filters, type: type || undefined });
  };

  const handleStatusSelect = (status: string) => {
    onFiltersChange({ ...filters, status: status || undefined });
  };

  const handlePaymentSelect = (payStatus: string) => {
    onFiltersChange({ ...filters, paymentStatus: payStatus || undefined });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const openTypeSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Types", onPress: () => handleTypeSelect("") },
      ...types.map((t) => ({
        label: t,
        onPress: () => handleTypeSelect(t),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Incentive Type", options });
  };

  const openPaymentSheet = () => {
    const options: ActionSheetOption[] = [
      { label: "All Payment Statuses", onPress: () => handlePaymentSelect("") },
      ...paymentStatuses.map((ps) => ({
        label: ps,
        onPress: () => handlePaymentSelect(ps),
      })),
    ];
    setSheetConfig({ visible: true, title: "Select Payment Status", options });
  };



  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.paymentStatus,
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
          label="Incentive Type"
          placeholder="All Incentive Types"
          value={filters.type || ""}
          onPress={openTypeSheet}
          onClear={() => handleTypeSelect("")}
          style={{ flex: 1 }}
        />
        <DropdownField
          label="Payment Status"
          placeholder="All Payment Statuses"
          value={filters.paymentStatus || ""}
          onPress={openPaymentSheet}
          onClear={() => handlePaymentSelect("")}
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
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={isAdmin ? "Search incentive title, employee..." : "Search incentive title..."}
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
