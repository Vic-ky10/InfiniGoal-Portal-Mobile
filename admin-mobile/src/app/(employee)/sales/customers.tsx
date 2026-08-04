import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useMyCustomers, useMySalesAreas, useActiveSalesAreas } from "@/features/sales/hooks/useEmployeeSales";
import { Customer } from "@/features/sales/sales.types";
import { EmployeeCustomerModal } from "@/features/sales/components";

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
    data: mySalesAreas = [],
  } = useMySalesAreas(employeeId);

  const {
    data: activeSalesAreas = [],
    isLoading: loadingAreas,
  } = useActiveSalesAreas();

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
    const area = mySalesAreas.find((a) => a.id === item.sales_area_id) || activeSalesAreas.find((a) => a.id === item.sales_area_id);
    const badgeColor =
      item.status === "Active"
        ? EMPLOYEE_COLOR
        : item.status === "Blocked"
        ? adminColors.danger
        : adminColors.textSecondary;

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
                backgroundColor: `${EMPLOYEE_COLOR}10`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="user" size={18} color={EMPLOYEE_COLOR} />
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
          <TouchableOpacity onPress={() => handleEdit(item)} style={{ padding: 4 }}>
            <Feather name="edit-2" size={14} color={EMPLOYEE_COLOR} />
          </TouchableOpacity>
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

        {/* dedicated Employee modal — no Assign staff, */}
        <EmployeeCustomerModal
          visible={modalVisible}
          onClose={handleCloseModal}
          customerToEdit={selectedCustomer}
          employeeId={employeeId}
          salesAreas={activeSalesAreas}
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
