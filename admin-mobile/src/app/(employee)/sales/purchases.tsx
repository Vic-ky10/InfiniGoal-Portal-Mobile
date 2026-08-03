import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useMyCustomerPurchases, useMyCustomers } from "@/features/sales/hooks/useEmployeeSales";
import { CustomerPurchase } from "@/features/sales/sales.types";
import { PurchaseModal } from "@/features/sales/components";
import { parsePurchaseRemarks } from "@/features/sales/sales.utils";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const employeeColor = "#22C55E"; // Green accent for employee portal

export default function EmployeePurchasesScreen() {
  const user = useAuthStore((state) => state.user);
  const { data: purchases = [], isLoading, isError, refetch, isRefetching } = useMyCustomerPurchases(user?.id || "");
  const { data: customers = [] } = useMyCustomers(user?.id || "");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CustomerPurchase | null>(null);

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

  const renderPurchaseItem = ({ item }: { item: CustomerPurchase }) => {
    const customer = customers.find((c) => c.id === item.customer_id);
    const meta = parsePurchaseRemarks(item.remarks, item.status);

    const purchaseBadgeColor =
      item.status === "Approved"
        ? employeeColor
        : item.status === "Pending"
        ? adminColors.warning
        : adminColors.danger;

    const incentiveBadgeColor =
      meta.incentive_status === "Approved"
        ? employeeColor
        : (meta.incentive_status === "Pending Review" || meta.incentive_status === "Eligible")
        ? adminColors.warning
        : adminColors.textSecondary;

    const isPending = item.status === "Pending";

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

          {isPending && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                <Feather name="edit-2" size={16} color={employeeColor} />
              </TouchableOpacity>
            </View>
          )}
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
            <AppText weight="700" color={item.incentive_amount > 0 ? employeeColor : adminColors.textSecondary}>
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
                Remarks: &quot;{meta.remarks}&quot;
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
          title="Logged Purchases"
          subtitle={`${purchases.length} total logged sales events`}
          rightComponent={
            <TouchableOpacity onPress={handleCreate} style={[styles.addBtn, { backgroundColor: employeeColor }]}>
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
                  isSelected && {
                    backgroundColor: employeeColor,
                    borderColor: employeeColor,
                  },
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
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
