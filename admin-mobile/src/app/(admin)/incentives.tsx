/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState, ActionSheet, ActionSheetOption } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useIncentives } from "@/features/incentive/hooks/useIncentives";
import IncentiveCard from "@/features/incentive/components/IncentiveCard";
import IncentiveModal from "@/features/incentive/components/IncentiveModal";
import IncentiveFilterBar, { IncentiveUiFilters } from "@/features/incentive/components/IncentiveFilterBar";
import { IncentiveStatus, IncentiveWithEmployee } from "@/features/incentive/incentive.types";
import { deleteIncentive } from "@/features/incentive/incentive.service";
import { toast } from "@/store/toast.store";

export default function IncentivesScreen() {
  const [filters, setFilters] = useState<IncentiveUiFilters>({});
  const [incentiveModalVisible, setIncentiveModalVisible] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<IncentiveWithEmployee | null>(null);
  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean;
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    options: [],
  });

  const { incentives, loading, refreshing, refresh, handleReview, handleMarkPaid } = useIncentives({});

  const { incentiveId } = useLocalSearchParams<{ incentiveId?: string }>();

  useEffect(() => {
    if (incentiveId && incentives.length > 0) {
      const incentive = incentives.find((i) => i.id === incentiveId);
      if (incentive) {
        setSelectedIncentive(incentive);
        setIncentiveModalVisible(true);
      } else {
        toast.error("The requested incentive could not be found.");
      }
    }
  }, [incentiveId, incentives]);

  const filteredIncentives = useMemo(() => {
    return incentives.filter((inc) => {
      // Search matches Title, Code, Employee Name
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesSearch =
          inc.title.toLowerCase().includes(s) ||
          inc.incentive_code.toLowerCase().includes(s) ||
          (inc.employee?.full_name || "").toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      // Type
      if (filters.type && inc.incentive_type !== filters.type) return false;

      // Status
      if (filters.status && inc.status !== filters.status) return false;

      // Payment Status
      if (filters.paymentStatus && inc.payment_status !== filters.paymentStatus) return false;

      // Date / Month / Year
      if (filters.date) {
        const [y, m] = filters.date.split("-").map(Number);
        if (inc.year !== y || inc.month !== m) return false;
      }
      if (filters.month) {
        const [y, m] = filters.month.split("-").map(Number);
        if (inc.year !== y || inc.month !== m) return false;
      }
      if (filters.year) {
        const y = Number(filters.year);
        if (inc.year !== y) return false;
      }

      return true;
    });
  }, [incentives, filters]);

  const handleCreateNew = () => {
    setSelectedIncentive(null);
    setIncentiveModalVisible(true);
  };

  const handleEdit = (incentive: IncentiveWithEmployee) => {
    setSelectedIncentive(incentive);
    setIncentiveModalVisible(true);
  };

  const handleDelete = (incentive: IncentiveWithEmployee) => {
    setActionSheetConfig({
      visible: true,
      title: "Delete Incentive",
      subtitle: `Are you sure you want to delete incentive ${incentive.incentive_code} (${incentive.title})?`,
      options: [
        {
          label: "Delete",
          isDestructive: true,
          icon: "🗑",
          onPress: async () => {
            const res = await deleteIncentive(incentive.id);
            if (res.success) {
              toast.success(res.message || "Incentive deleted successfully.");
              refresh();
            } else {
              toast.error(res.error || "Failed to delete incentive.");
            }
          },
        },
      ],
    });
  };

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Incentives"
          subtitle="Employee performance bonuses & awards"
          rightComponent={
            <TouchableOpacity
              onPress={handleCreateNew}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: adminColors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.md,
                gap: 4,
              }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                Award
              </AppText>
            </TouchableOpacity>
          }
        />

        {/* Enhanced Incentive Filter Bar */}
        <IncentiveFilterBar filters={filters} onFiltersChange={setFilters} isAdmin />

        {/* Incentives List */}
        <FlatList
          data={filteredIncentives}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredIncentives.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No incentive records found." />}
          renderItem={({ item }) => (
            <IncentiveCard
              incentive={item}
              onReview={handleReview}
              onMarkPaid={handleMarkPaid}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        />
      </View>

      <IncentiveModal
        visible={incentiveModalVisible}
        onClose={() => setIncentiveModalVisible(false)}
        onSuccess={refresh}
        incentiveToEdit={selectedIncentive}
      />

      <ActionSheet
        visible={actionSheetConfig.visible}
        onClose={() => setActionSheetConfig((prev) => ({ ...prev, visible: false }))}
        title={actionSheetConfig.title}
        subtitle={actionSheetConfig.subtitle}
        options={actionSheetConfig.options}
      />
    </Screen>
  );
}
