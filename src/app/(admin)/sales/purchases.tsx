import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState, ConfirmModal } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useCustomerPurchases, useCustomers, useDeleteCustomerPurchase } from "@/features/sales/hooks/useSales";
import { CustomerPurchase } from "@/features/sales/sales.types";
import { PurchaseModal } from "@/features/sales/components";
import { parsePurchaseRemarks } from "@/features/sales/sales.utils";
import { toast } from "@/store/toast.store";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

export default function PurchasesScreen() {
  const { data: purchases = [], isLoading, isError, refetch, isRefetching } = useCustomerPurchases();
  const { data: customers = [] } = useCustomers();
  const deleteMutation = useDeleteCustomerPurchase();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CustomerPurchase | null>(null);

  // Delete confirm state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<CustomerPurchase | null>(null);

  // Filtered List
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const customer = customers.find((c) => c.id === p.customer_id);
      const customerName = customer?.full_name || "";

      const matchesSearch =
        p.purchase_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.amount.toString().includes(searchQuery);

      const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, customers, searchQuery, selectedStatus]);

  const handleCreate = () => {
    setSelectedPurchase(null);
    setModalVisible(true);
  };

  const handleEdit = (purchase: CustomerPurchase) => {
    setSelectedPurchase(purchase);
    setModalVisible(true);
  };

  const handleDeleteRequest = (purchase: CustomerPurchase) => {
    setPurchaseToDelete(purchase);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!purchaseToDelete) return;
    deleteMutation.mutate(purchaseToDelete.id, {
      onSuccess: (res) => {
        setConfirmDeleteVisible(false);
        setPurchaseToDelete(null);
        if (res.success) {
          toast.success("Purchase record deleted successfully.");
        } else {
          toast.error(res.error || "Failed to delete purchase record.");
        }
      },
      onError: (err: any) => {
        setConfirmDeleteVisible(false);
        setPurchaseToDelete(null);
        toast.error(err.message || "Failed to delete purchase record.");
      },
    });
  };

  const renderPurchaseItem = ({ item }: { item: CustomerPurchase }) => {
    const customer = customers.find((c) => c.id === item.customer_id);
    const meta = parsePurchaseRemarks(item.remarks, item.status);

    const purchaseBadgeColor =
      item.status === "Approved"
        ? adminColors.success
        : item.status === "Pending"
        ? adminColors.warning
        : adminColors.danger;

    const incentiveBadgeColor =
      meta.incentive_status === "Approved"
        ? adminColors.success
        : (meta.incentive_status === "Pending Review" || meta.incentive_status === "Eligible")
        ? adminColors.warning
        : adminColors.textSecondary;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <AppText variant="h3" weight="700" color={adminColors.text}>
              {customer?.full_name || "Unknown Customer"}
            </AppText>
            <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
              Invoice: {item.purchase_code} • {item.purchase_date}
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
            <AppText variant="body" color={adminColors.textSecondary}>
              Purchase Amount:
            </AppText>
            <AppText weight="700" color={adminColors.text}>
              ₹{item.amount.toLocaleString("en-IN")}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body" color={adminColors.textSecondary}>
              Incentive Payout:
            </AppText>
            <AppText weight="700" color={item.incentive_amount > 0 ? adminColors.success : adminColors.textSecondary}>
              ₹{item.incentive_amount.toLocaleString("en-IN")}
            </AppText>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badgeCol}>
              <AppText variant="caption" color={adminColors.textSecondary} style={styles.badgeLabel}>
                Purchase Status:
              </AppText>
              <Badge label={item.status} color={purchaseBadgeColor} />
            </View>

            <View style={styles.badgeCol}>
              <AppText variant="caption" color={adminColors.textSecondary} style={styles.badgeLabel}>
                Incentive Status:
              </AppText>
              <Badge label={meta.incentive_status} color={incentiveBadgeColor} />
            </View>
          </View>

          {!!meta.remarks && (
            <View style={styles.remarksRow}>
              <AppText variant="caption" color={adminColors.textSecondary} style={{ fontStyle: "italic" }}>
                Remarks: "{meta.remarks}"
              </AppText>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <Screen
      isLoading={isLoading}
      isError={isError}
      errorMessage="Unable to load customer purchases."
      onRetry={refetch}
      scroll={false}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Customer Purchases"
          subtitle={`${purchases.length} total logged sales events`}
          rightComponent={
            <TouchableOpacity onPress={handleCreate} style={styles.addBtn}>
              <Feather name="plus" size={18} color="#FFFFFF" />
              <AppText weight="700" color="#FFFFFF">
                Record
              </AppText>
            </TouchableOpacity>
          }
        />

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Status filters */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((s) => {
            const isSelected = selectedStatus === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSelectedStatus(s)}
                style={[
                  styles.filterItem,
                  isSelected && styles.filterItemActive,
                ]}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {s}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredPurchases}
          keyExtractor={(item) => item.id}
          renderItem={renderPurchaseItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? "No matching purchases found" : "No purchase transactions logged"}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />

        {/* Form Modal */}
        <PurchaseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          purchaseToEdit={selectedPurchase}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          visible={confirmDeleteVisible}
          title="Delete Purchase Record"
          message={`Are you sure you want to delete purchase "${purchaseToDelete?.purchase_code}" for ₹${purchaseToDelete?.amount.toLocaleString("en-IN")}? This will update stats and reclaim linked incentives.`}
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
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  filterItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterItemActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
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
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  badgeCol: {
    flex: 1,
    gap: 4,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  remarksRow: {
    marginTop: spacing.xs,
    backgroundColor: adminColors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
});
