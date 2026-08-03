import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState, ConfirmModal } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useIncentiveRules, useDeleteIncentiveRule } from "@/features/sales/hooks/useSales";
import { IncentiveRule } from "@/features/sales/sales.types";
import { IncentiveRuleModal } from "@/features/sales/components";
import { toast } from "@/store/toast.store";

export default function RulesScreen() {
  const { data: rules = [], isLoading, isError, refetch, isRefetching } = useIncentiveRules();
  const deleteMutation = useDeleteIncentiveRule();

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState<IncentiveRule | null>(null);

  // Delete confirm state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<IncentiveRule | null>(null);

  const handleCreate = () => {
    setSelectedRule(null);
    setModalVisible(true);
  };

  const handleEdit = (rule: IncentiveRule) => {
    setSelectedRule(rule);
    setModalVisible(true);
  };

  const handleDeleteRequest = (rule: IncentiveRule) => {
    setRuleToDelete(rule);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!ruleToDelete) return;
    deleteMutation.mutate(ruleToDelete.id, {
      onSuccess: (res) => {
        setConfirmDeleteVisible(false);
        setRuleToDelete(null);
        if (res.success) {
          toast.success("Incentive rule deleted successfully.");
        } else {
          toast.error(res.error || "Failed to delete rule.");
        }
      },
      onError: (err: any) => {
        setConfirmDeleteVisible(false);
        setRuleToDelete(null);
        toast.error(err.message || "Failed to delete rule.");
      },
    });
  };

  const renderRuleItem = ({ item }: { item: IncentiveRule }) => {
    const badgeColor = item.status === "Active" ? adminColors.success : adminColors.textSecondary;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <AppText variant="h3" weight="700" color={adminColors.text}>
                Min Purchase: ₹{item.minimum_purchase.toLocaleString("en-IN")}
              </AppText>
              <Badge label={item.status} color={badgeColor} />
            </View>
            <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
              Payout Reward: ₹{item.incentive_amount.toLocaleString("en-IN")}
            </AppText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
              <Feather name="edit-2" size={16} color={adminColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteRequest(item)} style={styles.actionBtn}>
              <Feather name="trash-2" size={16} color={adminColors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="award" size={14} color={item.status === "Active" ? adminColors.success : adminColors.textSecondary} />
            <AppText variant="body" color={adminColors.textSecondary} style={styles.detailText}>
              {item.status === "Active"
                ? "Currently active for matching transactions."
                : "Inactive — not applied to new purchases."}
            </AppText>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Screen
      isLoading={isLoading}
      isError={isError}
      errorMessage="Unable to load incentive rules."
      onRetry={refetch}
      scroll={false}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Incentive Rules"
          subtitle={`${rules.length} total commission rule thresholds`}
          rightComponent={
            <TouchableOpacity onPress={handleCreate} style={styles.addBtn}>
              <Feather name="plus" size={18} color="#FFFFFF" />
              <AppText weight="700" color="#FFFFFF">
                Add
              </AppText>
            </TouchableOpacity>
          }
        />

        <FlatList
          data={rules}
          keyExtractor={(item) => item.id}
          renderItem={renderRuleItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title="No incentive rules configured"
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />

        {/* Form Modal */}
        <IncentiveRuleModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          ruleToEdit={selectedRule}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          visible={confirmDeleteVisible}
          title="Delete Incentive Rule"
          message={`Are you sure you want to delete this rule? Auto-incentives logic will stop evaluating this threshold.`}
          loading={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteVisible(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: adminColors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  cardDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 13,
  },
});
