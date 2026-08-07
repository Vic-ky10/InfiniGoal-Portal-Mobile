import React, { useState, useMemo, useEffect } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useMyCustomerPurchases, useMyCustomers, useActiveSalesAreas } from "@/features/sales/hooks/useEmployeeSales";
import { CustomerPurchase } from "@/features/sales/sales.types";
import { PurchaseModal } from "@/features/sales/components";
import { parsePurchaseRemarks } from "@/features/sales/sales.utils";
import { toast } from "@/store/toast.store";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const employeeColor = "#22C55E"; // Green accent for employee portal

export default function EmployeePurchasesScreen() {
  const user = useAuthStore((state) => state.user);
  const { data: purchases = [], isLoading, isError, refetch, isRefetching } = useMyCustomerPurchases(user?.id || "");
  const { data: customers = [] } = useMyCustomers(user?.id || "");
  const { data: salesAreas = [] } = useActiveSalesAreas();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CustomerPurchase | null>(null);

  const { purchaseId } = useLocalSearchParams<{ purchaseId?: string }>();

  useEffect(() => {
    if (purchaseId && purchases.length > 0) {
      const purchase = purchases.find((p) => p.id === purchaseId);
      if (purchase) {
        setSelectedPurchase(purchase);
        setModalVisible(true);
      } else {
        toast.error("The requested purchase record could not be found.");
      }
    }
  }, [purchaseId, purchases]);

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
    const area = salesAreas.find((a) => a.id === customer?.sales_area_id);
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
                backgroundColor: `${employeeColor}10`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="shopping-cart" size={18} color={employeeColor} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="700" variant="body" color={adminColors.text}>
                {customer?.full_name || "Unknown Customer"}
              </AppText>
            </View>
          </View>
          <Badge label={item.status} color={purchaseBadgeColor} />
        </View>

        {/* MIDDLE */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <AppText weight="700" variant="h2" color={employeeColor}>
              ₹{item.amount.toLocaleString("en-IN")}
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <AppText variant="caption" color={adminColors.textSecondary} weight="600">
                Incentive:
              </AppText>
              <Badge label={meta.incentive_status} color={incentiveBadgeColor} variant="subtle" />
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <Feather name="map-pin" size={12} color={adminColors.textSecondary} />
            <AppText variant="caption" color={adminColors.textSecondary}>
              Area: {area?.area_name || "No Area Assigned"}
            </AppText>
          </View>

          {item.incentive_amount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Feather name="award" size={12} color={employeeColor} />
              <AppText variant="caption" color={employeeColor} weight="600">
                Payout Amount: ₹{item.incentive_amount.toLocaleString("en-IN")}
              </AppText>
            </View>
          )}

          {!!meta.remarks && (
            <AppText
              variant="caption"
              color={adminColors.textSecondary}
              style={{ fontStyle: "italic", marginTop: 4, lineHeight: 16 }}
            >
              Remarks: &quot;{meta.remarks}&quot;
            </AppText>
          )}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="calendar" size={12} color={adminColors.textSecondary} />
            <AppText variant="caption" color={adminColors.textSecondary}>
              {item.purchase_date}
            </AppText>
          </View>

          {isPending && (
            <TouchableOpacity onPress={() => handleEdit(item)} style={{ padding: 4 }}>
              <Feather name="edit-2" size={14} color={employeeColor} />
            </TouchableOpacity>
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
          showAdminReview={false}
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
