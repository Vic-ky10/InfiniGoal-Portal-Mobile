import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
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
    const area = salesAreas.find((a) => a.id === item.sales_area_id);
    const badgeColor =
      item.status === "Active"
        ? adminColors.success
        : item.status === "Inactive"
        ? adminColors.textSecondary
        : adminColors.danger;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <AppText variant="h3" weight="700" color={adminColors.text}>
                {item.full_name}
              </AppText>
              <Badge label={item.status} color={badgeColor} />
            </View>
            <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
              Code: {item.customer_code}
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
            <Feather name="phone" size={14} color={adminColors.textSecondary} />
            <AppText variant="body" color={adminColors.textSecondary} style={styles.detailText}>
              {item.phone}
            </AppText>
          </View>

          {!!item.email && (
            <View style={styles.detailRow}>
              <Feather name="mail" size={14} color={adminColors.textSecondary} />
              <AppText variant="body" color={adminColors.textSecondary} style={styles.detailText}>
                {item.email}
              </AppText>
            </View>
          )}

          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={adminColors.textSecondary} />
            <AppText variant="body" color={adminColors.textSecondary} style={styles.detailText}>
              {area?.area_name || "No Area Assigned"}
            </AppText>
          </View>

          {!!item.notes && (
            <View style={styles.notesRow}>
              <AppText variant="caption" color={adminColors.textSecondary} style={{ fontStyle: "italic" }}>
                Notes: "{item.notes}"
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
