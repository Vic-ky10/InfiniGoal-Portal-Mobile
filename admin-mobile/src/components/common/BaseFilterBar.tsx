import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TouchableWithoutFeedback } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Input, AppText } from "@/components/ui";
import { useThemeColors, radius, spacing } from "@/theme";

interface BaseFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  searchFallback?: React.ReactNode;
  activeFilterCount: number;
  quickChips?: React.ReactNode;
  expandedContent?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  onReset?: () => void;
}

export default function BaseFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchFallback,
  activeFilterCount,
  quickChips,
  expandedContent,
  containerStyle,
  onReset,
}: BaseFilterBarProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, containerStyle, { zIndex: 1000, position: "relative" }]}>
      {/* SEARCH INPUT & FILTER TOGGLE */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          {onSearchChange ? (
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery || ""}
              onChangeText={onSearchChange}
              containerStyle={{ marginBottom: 0 }}
            />
          ) : (
            searchFallback
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded(!expanded)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: activeFilterCount > 0 ? `${colors.primary}15` : colors.surface,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="sliders" size={20} color={activeFilterCount > 0 ? colors.primary : colors.textSecondary} />
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
      {quickChips && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {quickChips}
        </ScrollView>
      )}

      {/* EXPANDED EXTRA FILTERS BACKDROP (Tap outside to close) */}
      {expanded && expandedContent && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setExpanded(false)}
          style={styles.backdrop}
        />
      )}

      {/* EXPANDED EXTRA FILTERS */}
      {expanded && expandedContent && (
        <View style={[styles.expandedBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Feather name="sliders" size={16} color={colors.primary} />
              <AppText weight="700" style={{ fontSize: 15 }} color={colors.text}>Filters</AppText>
              {activeFilterCount > 0 && (
                <View style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm }}>
                  <AppText variant="caption" weight="700" color={colors.primary} style={{ fontSize: 11 }}>
                    {activeFilterCount}
                  </AppText>
                </View>
              )}
            </View>
            {onReset && activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={onReset}
                accessibilityLabel="Clear Filters"
                accessibilityRole="button"
                style={{ padding: spacing.xs }}
              >
                <Feather name="x" size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {expandedContent}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export const FilterChip = ({ 
  label, 
  isSelected, 
  onPress,
  isExpandedChip = false,
}: { 
  label: string; 
  isSelected: boolean; 
  onPress: () => void;
  isExpandedChip?: boolean;
}) => {
  const colors = useThemeColors();
  
  if (isExpandedChip) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <AppText variant="caption" weight="600" color={isSelected ? colors.primary : colors.text}>
          {label}
        </AppText>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText variant="caption" weight="600" color={isSelected ? "#FFF" : colors.text}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export function DropdownField({
  label,
  value,
  placeholder,
  onPress,
  onClear,
  style,
}: {
  label?: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  onClear?: () => void;
  style?: any;
}) {
  const colors = useThemeColors();
  return (
    <View style={StyleSheet.flatten([{ marginBottom: 0 }, style])}>
      {label && (
        <AppText
          weight="600"
          style={{ marginBottom: spacing.xs, fontSize: 13 }}
          color={colors.textSecondary}
        >
          {label}
        </AppText>
      )}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={{
          height: 52,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.background,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <AppText style={{ fontSize: 15 }} color={value ? colors.text : colors.textSecondary}>
          {value || placeholder}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {onClear && value && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onClear();
              }}
              style={{ padding: spacing.xs }}
            >
              <Feather name="x" size={14} color={colors.danger} />
            </TouchableOpacity>
          )}
          <Feather name="chevron-down" size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeCount: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
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
  backdrop: {
    position: "absolute",
    top: 50,
    left: -1000,
    right: -1000,
    bottom: -2000,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  expandedBox: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.lg,
    zIndex: 1000,
    maxHeight: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  resetBtn: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
});
