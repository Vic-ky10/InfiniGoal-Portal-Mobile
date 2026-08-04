import React, { useState } from "react";
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
      <Card
        style={{
          borderWidth: 1,
          borderColor: adminColors.border,
          borderRadius: radius.lg,
          ...shadows.sm,
          padding: spacing.md,
          backgroundColor: adminColors.background,
          marginBottom: spacing.md,
        }}
      >
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing.sm,
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                backgroundColor: `${adminColors.primary}10`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="settings" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="700" variant="body" color={adminColors.text}>
                Min Purchase: ₹{item.minimum_purchase.toLocaleString("en-IN")}
              </AppText>
            </View>
          </View>
          <Badge label={item.status} color={badgeColor} />
        </View>

        {/* MIDDLE */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.xs }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Payout Reward:
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.primary}>
              ₹{item.incentive_amount.toLocaleString("en-IN")}
            </AppText>
          </View>
        </View>

        {/* FOOTER */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: `${adminColors.border}80`,
            paddingTop: spacing.sm,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather
              name="info"
              size={12}
              color={item.status === "Active" ? adminColors.success : adminColors.textSecondary}
            />
            <AppText variant="caption" color={adminColors.textSecondary} style={{ flex: 1 }}>
              {item.status === "Active"
                ? "Active rule"
                : "Inactive rule"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={{ padding: 4 }}>
              <Feather name="edit-2" size={14} color={adminColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteRequest(item)} style={{ padding: 4 }}>
              <Feather name="trash-2" size={14} color={adminColors.danger} />
            </TouchableOpacity>
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
