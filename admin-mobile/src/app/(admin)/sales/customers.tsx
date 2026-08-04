import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState, ConfirmModal } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useCustomers, useDeleteCustomer, useSalesAreas } from "@/features/sales/hooks/useSales";
import { Customer } from "@/features/sales/sales.types";
import { CustomerModal } from "@/features/sales/components";
import { toast } from "@/store/toast.store";

const STATUS_FILTERS = ["All", "Active", "Inactive", "Blocked"];

export default function CustomersScreen() {
  const { data: customers = [], isLoading, isError, refetch, isRefetching } = useCustomers();
  const { data: salesAreas = [] } = useSalesAreas();
  const deleteMutation = useDeleteCustomer();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Delete confirm state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === "All" || c.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, selectedStatus]);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  const handleDeleteRequest = (customer: Customer) => {
    setCustomerToDelete(customer);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    deleteMutation.mutate(customerToDelete.id, {
      onSuccess: (res) => {
        setConfirmDeleteVisible(false);
        setCustomerToDelete(null);
        if (res.success) {
          toast.success("Customer deleted successfully.");
        } else {
          toast.error(res.error || "Failed to delete customer.");
        }
      },
      onError: (err: any) => {
        setConfirmDeleteVisible(false);
        setCustomerToDelete(null);
        toast.error(err.message || "Failed to delete customer.");
      },
    });
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const badgeColor =
      item.status === "Active"
        ? adminColors.success
        : item.status === "Blocked"
        ? adminColors.danger
        : adminColors.textSecondary;

    const area = salesAreas.find((a) => a.id === item.sales_area_id);

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
              <Feather name="user" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="700" variant="body" color={adminColors.text}>
                {item.full_name}
              </AppText>
            </View>
          </View>
          <Badge label={item.status} color={badgeColor} />
        </View>

        {/* MIDDLE */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="phone" size={12} color={adminColors.textSecondary} />
            <AppText variant="caption" color={adminColors.textSecondary}>
              {item.phone}
            </AppText>
          </View>

          {!!item.email && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="mail" size={12} color={adminColors.textSecondary} />
              <AppText variant="caption" color={adminColors.textSecondary}>
                {item.email}
              </AppText>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="map-pin" size={12} color={adminColors.textSecondary} />
            <AppText variant="caption" color={adminColors.textSecondary}>
              Area: {area?.area_name || "No Area Assigned"}
            </AppText>
          </View>

          {!!item.notes && (
            <AppText
              variant="caption"
              color={adminColors.textSecondary}
              style={{ fontStyle: "italic", marginTop: 4, lineHeight: 16 }}
            >
              Notes: &quot;{item.notes}&quot;
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
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
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
      errorMessage="Unable to load customer directory."
      onRetry={refetch}
      scroll={false}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Customers"
          subtitle={`${customers.length} total active buyer accounts`}
          rightComponent={
            <TouchableOpacity onPress={handleCreate} style={styles.addBtn}>
              <Feather name="plus" size={18} color="#FFFFFF" />
              <AppText weight="700" color="#FFFFFF">
                Add
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
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? "No matching customers found" : "No customer accounts found"}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />

        {/* Form Modal */}
        <CustomerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          customerToEdit={selectedCustomer}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          visible={confirmDeleteVisible}
          title="Delete Customer"
          message={`Are you sure you want to delete "${customerToDelete?.full_name}"? All associated transactions will remain but customer record is deleted.`}
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
  notesRow: {
    marginTop: spacing.xs,
    backgroundColor: adminColors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
});
