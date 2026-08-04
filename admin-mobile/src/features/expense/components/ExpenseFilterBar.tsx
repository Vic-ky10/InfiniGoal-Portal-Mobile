import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Input, AppText } from "@/components/ui";
import { useThemeColors, radius, spacing } from "@/theme";
import { ExpenseFilters, EXPENSE_CATEGORY } from "../expense.types";

interface Props {
  filters: ExpenseFilters;
  onFiltersChange: (newFilters: ExpenseFilters) => void;
  showEmployeeFilter?: boolean;
}

export default function ExpenseFilterBar({
  filters,
  onFiltersChange,
}: Props) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const statuses = ["All", "Pending", "Approved", "Rejected"] as const;
  const categories = ["All", ...Object.values(EXPENSE_CATEGORY)] as const;

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, searchQuery: text });
  };

  const handleStatusSelect = (status: (typeof statuses)[number]) => {
    onFiltersChange({
      ...filters,
      status: status === "All" ? undefined : (status as any),
    });
  };

  const handleCategorySelect = (category: (typeof categories)[number]) => {
    onFiltersChange({
      ...filters,
      category: category === "All" ? undefined : (category as any),
    });
  };

  const handleReceiptToggle = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasReceipt: value });
  };

  const activeFilterCount = [
    filters.status && filters.status !== "All",
    filters.category && filters.category !== "All",
    filters.hasReceipt !== undefined && filters.hasReceipt !== null,
    Boolean(filters.searchQuery?.trim()),
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* SEARCH INPUT & FILTER TOGGLE */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Search by expense title, category, employee..."
            value={filters.searchQuery || ""}
            onChangeText={handleSearchChange}
          />
        </View>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: activeFilterCount > 0 ? `${colors.primary}15` : colors.surface,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="sliders" size={18} color={activeFilterCount > 0 ? colors.primary : colors.textSecondary} />
          {activeFilterCount > 0 && (
            <View style={[styles.badgeCount, { backgroundColor: colors.primary }]}>
              <AppText variant="caption" weight="700" color="#fff" style={{ fontSize: 10 }}>
                {activeFilterCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* QUICK STATUS CHIPS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
        {statuses.map((st) => {
          const isSelected = (filters.status === undefined && st === "All") || filters.status === st;
          return (
            <TouchableOpacity
              key={st}
              onPress={() => handleStatusSelect(st)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText variant="caption" weight="600" color={isSelected ? "#FFF" : colors.text}>
                {st}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* EXPANDED EXTRA FILTERS */}
      {expanded && (
        <View style={[styles.expandedBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* CATEGORIES */}
          <AppText weight="700" variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Filter by Category
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {categories.map((cat) => {
              const isSelected = (filters.category === undefined && cat === "All") || filters.category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategorySelect(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" weight="600" color={isSelected ? colors.primary : colors.text}>
                    {cat}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* RECEIPT ATTACHMENT */}
          <AppText weight="700" variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
            Receipt Attachment
          </AppText>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            {[
              { label: "All Expenses", value: null },
              { label: "📎 Has Receipt", value: true },
              { label: "No Receipt", value: false },
            ].map((opt) => {
              const isSel = filters.hasReceipt === opt.value;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => handleReceiptToggle(opt.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSel ? `${colors.primary}18` : colors.background,
                      borderColor: isSel ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" weight="600" color={isSel ? colors.primary : colors.text}>
                    {opt.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCount: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  expandedBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
});
