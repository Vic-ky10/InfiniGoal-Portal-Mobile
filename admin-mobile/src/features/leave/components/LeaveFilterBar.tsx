import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Input, AppText, DatePickerField } from "@/components/ui";
import { useThemeColors, radius, spacing } from "@/theme";
import { LeaveFilters, LEAVE_STATUS, LEAVE_TYPE } from "../leave.types";
import { DEPARTMENTS } from "@/features/employee/employee.constants";

interface Props {
  filters: LeaveFilters;
  onFiltersChange: (newFilters: LeaveFilters) => void;
  isAdmin?: boolean;
}

export default function LeaveFilterBar({
  filters,
  onFiltersChange,
  isAdmin = false,
}: Props) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const statuses = ["All", ...Object.values(LEAVE_STATUS)] as const;
  const leaveTypes = ["All", ...Object.values(LEAVE_TYPE)] as const;
  const departments = ["All", ...DEPARTMENTS] as const;

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const handleMonthChange = (text: string) => {
    onFiltersChange({ ...filters, month: text });
  };

  const handleStatusSelect = (status: (typeof statuses)[number]) => {
    onFiltersChange({
      ...filters,
      status: status === "All" ? undefined : (status as any),
    });
  };

  const handleLeaveTypeSelect = (type: (typeof leaveTypes)[number]) => {
    onFiltersChange({
      ...filters,
      leaveType: type === "All" ? undefined : (type as any),
    });
  };

  const handleDepartmentSelect = (dept: (typeof departments)[number]) => {
    onFiltersChange({
      ...filters,
      department: dept === "All" ? undefined : dept,
    });
  };

  const activeFilterCount = [
    filters.status,
    filters.leaveType,
    Boolean(filters.month?.trim()),
    isAdmin && filters.department && filters.department !== "All",
    isAdmin && Boolean(filters.search?.trim()),
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* SEARCH INPUT & FILTER TOGGLE */}
      <View style={styles.searchRow}>
        {isAdmin ? (
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Search by employee name or ID..."
              value={filters.search || ""}
              onChangeText={handleSearchChange}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <AppText variant="body" color={colors.textSecondary}>
              Filter your leave requests
            </AppText>
          </View>
        )}
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
          const isSelected = (!filters.status && st === "All") || filters.status === st;
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
          {isAdmin && (
            <>
              {/* DEPARTMENTS */}
              <AppText weight="700" variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Filter by Department
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {departments.map((dept) => {
                  const isSelected = (!filters.department && dept === "All") || filters.department === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      onPress={() => handleDepartmentSelect(dept)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <AppText variant="caption" weight="600" color={isSelected ? colors.primary : colors.text}>
                        {dept}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* LEAVE TYPES */}
          <AppText weight="700" variant="caption" color={colors.textSecondary} style={{ marginTop: isAdmin ? spacing.sm : 0, marginBottom: spacing.xs }}>
            Leave Type
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {leaveTypes.map((type) => {
              const isSelected = (!filters.leaveType && type === "All") || filters.leaveType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleLeaveTypeSelect(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" weight="600" color={isSelected ? colors.primary : colors.text}>
                    {type}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* MONTH */}
          <AppText weight="700" variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
            Month (YYYY-MM)
          </AppText>
          <DatePickerField
            placeholder="e.g. 2024-01"
            value={filters.month || ""}
            onChange={handleMonthChange}
            mode="month"
            onClear={() => handleMonthChange("")}
          />
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
