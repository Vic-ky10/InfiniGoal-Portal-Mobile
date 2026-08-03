import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useMyCustomers, useMySalesAreas } from "@/features/sales/hooks/useEmployeeSales";
import { Customer } from "@/features/sales/sales.types";
import { EmployeeCustomerModal } from "@/features/sales/components";
import { toast } from "@/store/toast.store";

const STATUS_FILTERS = ["All", "Active", "Inactive", "Blocked"];
const EMPLOYEE_COLOR = "#22C55E";

export default function EmployeeCustomersScreen() {
  const user = useAuthStore((state) => state.user);
  const employeeId = user?.id || "";

  const {
    data: customers = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMyCustomers(employeeId);

  const {
    data: salesAreas = [],
    isLoading: loadingAreas,
  } = useMySalesAreas(employeeId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filtered list
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

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCustomer(null);
    refetch();
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const area = salesAreas.find((a) => a.id === item.sales_area_id);
    const badgeColor =
      item.status === "Active"
        ? EMPLOYEE_COLOR
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

          {/* Edit only — employees cannot delete customers */}
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Feather name="edit-2" size={16} color={EMPLOYEE_COLOR} />
          </TouchableOpacity>
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
                {item.notes}
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
      errorMessage="Unable to load your customer directory."
      onRetry={refetch}
      scroll={false}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="My Customers"
          subtitle={`${customers.length} assigned client account${customers.length !== 1 ? "s" : ""}`}
          rightComponent={
            <TouchableOpacity
              onPress={handleCreate}
              style={[styles.addBtn, { backgroundColor: EMPLOYEE_COLOR }]}
            >
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
                  isSelected && {
                    backgroundColor: EMPLOYEE_COLOR,
                    borderColor: EMPLOYEE_COLOR,
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
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery
                  ? "No matching customers found"
                  : "No customers assigned yet"
              }
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />

        {/* Dedicated Employee modal — no Assign Staff, auto-sets assigned_employee_id */}
        <EmployeeCustomerModal
          visible={modalVisible}
          onClose={handleCloseModal}
          customerToEdit={selectedCustomer}
          employeeId={employeeId}
          salesAreas={salesAreas}
          loadingAreas={loadingAreas}
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
