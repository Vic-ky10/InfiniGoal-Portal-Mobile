import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from "react-native";
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
}: BaseFilterBarProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* SEARCH INPUT & FILTER TOGGLE */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          {onSearchChange ? (
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery || ""}
              onChangeText={onSearchChange}
            />
          ) : (
            searchFallback
          )}
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
      {quickChips && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {quickChips}
        </ScrollView>
      )}

      {/* EXPANDED EXTRA FILTERS */}
      {expanded && expandedContent && (
        <View style={[styles.expandedBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {expandedContent}
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
