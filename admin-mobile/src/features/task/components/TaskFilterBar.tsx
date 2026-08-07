import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui";
import { BaseFilterBar, FilterChip } from "@/components/common";
import { useThemeColors, spacing } from "@/theme";
import { TaskFilters, TASK_STATUS, TASK_PRIORITY } from "../task.types";

interface Props {
  filters: TaskFilters;
  onFiltersChange: (newFilters: TaskFilters) => void;
  isAdmin?: boolean;
}

export default function TaskFilterBar({
  filters,
  onFiltersChange,
  isAdmin = false,
}: Props) {
  const colors = useThemeColors();

  const statuses = ["All", ...Object.values(TASK_STATUS)] as const;
  const priorities = ["All", ...Object.values(TASK_PRIORITY)] as const;

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleStatusSelect = (status: (typeof statuses)[number]) => {
    onFiltersChange({
      ...filters,
      status: status === "All" ? undefined : (status as any),
    });
  };

  const handlePrioritySelect = (priority: (typeof priorities)[number]) => {
    onFiltersChange({
      ...filters,
      priority: priority === "All" ? undefined : (priority as any),
    });
  };

  const activeFilterCount = [
    filters.status,
    filters.priority,
    Boolean(filters.search?.trim()),
  ].filter(Boolean).length;

  return (
    <BaseFilterBar
      searchQuery={filters.search}
      onSearchChange={handleSearchChange}
      searchPlaceholder={isAdmin ? "Search tasks..." : "Search your tasks..."}
      activeFilterCount={activeFilterCount}
      quickChips={
        <>
          {statuses.map((st) => {
            const isSelected = (!filters.status && st === "All") || filters.status === st;
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
      }
      expandedContent={
        <>
          {/* PRIORITIES */}
          <AppText weight="700" variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Filter by Priority
          </AppText>
          <View style={styles.expandedChipsRow}>
            {priorities.map((priority) => {
              const isSelected = (!filters.priority && priority === "All") || filters.priority === priority;
              return (
                <FilterChip
                  key={priority}
                  label={priority}
                  isSelected={isSelected}
                  onPress={() => handlePrioritySelect(priority)}
                  isExpandedChip
                />
              );
            })}
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  expandedChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
