import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState, ConfirmModal } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useSalesAreas, useDeleteSalesArea, useCustomers } from "@/features/sales/hooks/useSales";
import { SalesArea } from "@/features/sales/sales.types";
import { SalesAreaModal } from "@/features/sales/components";
import { toast } from "@/store/toast.store";

const STATUS_FILTERS = ["All", "Active", "Inactive"];

export default function AreasScreen() {
  const { data: areas = [], isLoading, isError, refetch, isRefetching } = useSalesAreas();
  const { data: customers = [] } = useCustomers();
  const deleteMutation = useDeleteSalesArea();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<SalesArea | null>(null);

  // Delete confirm state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<SalesArea | null>(null);

  // Filtered List
  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      const matchesSearch =
        a.area_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.area_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.area_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.state?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === "All" || a.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [areas, searchQuery, selectedStatus]);

  const handleCreate = () => {
    setSelectedArea(null);
    setModalVisible(true);
  };

  const handleEdit = (area: SalesArea) => {
    setSelectedArea(area);
    setModalVisible(true);
  };

  const handleDeleteRequest = (area: SalesArea) => {
    setAreaToDelete(area);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!areaToDelete) return;
    deleteMutation.mutate(areaToDelete.id, {
      onSuccess: (res) => {
        setConfirmDeleteVisible(false);
        setAreaToDelete(null);
        if (res.success) {
          toast.success("Sales area deleted successfully.");
        } else {
          toast.error(res.error || "Failed to delete sales area.");
        }
      },
      onError: (err: any) => {
        setConfirmDeleteVisible(false);
        setAreaToDelete(null);
        toast.error(err.message || "Failed to delete sales area.");
      },
    });
  };

  const renderAreaItem = ({ item }: { item: SalesArea }) => {
    const badgeColor = item.status === "Active" ? adminColors.success : adminColors.textSecondary;
    const customersInArea = customers.filter((c) => c.sales_area_id === item.id);
    const customerCount = customersInArea.length;
    const repCount = new Set(
      customersInArea.map((c) => c.assigned_employee_id).filter(Boolean)
    ).size;

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
              <Feather name="map-pin" size={18} color={adminColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="700" variant="body" color={adminColors.text}>
                {item.area_name}
              </AppText>
              <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                Type: {item.area_type}
              </AppText>
            </View>
          </View>
          <Badge label={item.status} color={badgeColor} />
        </View>

        {/* MIDDLE */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
          {!!(item.address || item.city || item.state) && (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
              <Feather name="map" size={12} color={adminColors.textSecondary} style={{ marginTop: 2 }} />
              <AppText variant="caption" color={adminColors.textSecondary} style={{ flex: 1, lineHeight: 16 }}>
                {[item.address, item.city, item.state, item.pincode].filter(Boolean).join(", ")}
              </AppText>
            </View>
          )}

          {!!item.contact_person && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Feather name="user" size={12} color={adminColors.textSecondary} />
              <AppText variant="caption" color={adminColors.textSecondary}>
                Contact: {item.contact_person} {item.contact_phone ? `(${item.contact_phone})` : ""}
              </AppText>
            </View>
          )}

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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="users" size={12} color={adminColors.textSecondary} />
              <AppText variant="caption" color={adminColors.textSecondary} weight="600">
                {customerCount} Customers
              </AppText>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="user-check" size={12} color={adminColors.textSecondary} />
              <AppText variant="caption" color={adminColors.textSecondary} weight="600">
                {repCount} Representatives
              </AppText>
            </View>
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
      errorMessage="Unable to load sales areas."
      onRetry={refetch}
      scroll={false}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Sales Areas"
          subtitle={`${areas.length} total mapped distribution zones`}
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
          data={filteredAreas}
          keyExtractor={(item) => item.id}
          renderItem={renderAreaItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? "No matching sales areas found" : "No sales areas recorded"}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />

        {/* Form Modal */}
        <SalesAreaModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          areaToEdit={selectedArea}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          visible={confirmDeleteVisible}
          title="Delete Sales Area"
          message={`Are you sure you want to delete sales area "${areaToDelete?.area_name}"?`}
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
