import { useState } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useIncentives } from "@/features/incentive/hooks/useIncentives";
import IncentiveCard from "@/features/incentive/components/IncentiveCard";
import IncentiveModal from "@/features/incentive/components/IncentiveModal";
import { IncentiveStatus, IncentiveWithEmployee } from "@/features/incentive/incentive.types";
import { deleteIncentive } from "@/features/incentive/incentive.service";

const STATUS_FILTERS: { label: string; value: IncentiveStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

export default function IncentivesScreen() {
  const [statusFilter, setStatusFilter] = useState<IncentiveStatus | "">("");
  const [incentiveModalVisible, setIncentiveModalVisible] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<IncentiveWithEmployee | null>(null);

  const { incentives, loading, refreshing, refresh, handleReview, handleMarkPaid } = useIncentives({
    status: statusFilter || undefined,
  });

  const handleCreateNew = () => {
    setSelectedIncentive(null);
    setIncentiveModalVisible(true);
  };

  const handleEdit = (incentive: IncentiveWithEmployee) => {
    setSelectedIncentive(incentive);
    setIncentiveModalVisible(true);
  };

  const handleDelete = (incentive: IncentiveWithEmployee) => {
    Alert.alert(
      "Delete Incentive",
      `Are you sure you want to delete incentive ${incentive.incentive_code} (${incentive.title})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteIncentive(incentive.id);
            if (res.success) {
              Alert.alert("Success", res.message);
              refresh();
            } else {
              Alert.alert("Error", res.error || "Failed to delete incentive.");
            }
          },
        },
      ]
    );
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

        {/* Status Filters */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
          {STATUS_FILTERS.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setStatusFilter(opt.value)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? adminColors.primary : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? adminColors.primary : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Incentives List */}
        <FlatList
          data={incentives}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: incentives.length === 0 ? 1 : undefined,
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
    </Screen>
  );
}
