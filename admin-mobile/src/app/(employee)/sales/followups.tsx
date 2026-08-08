import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge, Button, Input, DatePickerField } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { useAuthStore } from "@/store";
import { useMyCustomers } from "@/features/sales/hooks/useEmployeeSales";
import {
  useCustomerFollowups,
  useCreateCustomerFollowup,
  useUpdateCustomerFollowup,
  useDeleteCustomerFollowup,
} from "@/features/sales/hooks/useSales";
import { CustomerFollowup } from "@/features/sales/sales.types";
import { toast } from "@/store/toast.store";

export default function EmployeeFollowupsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const employeeId = user?.id || "";

  // Queries
  const { data: followups = [], isLoading: loadFollow, refetch: refetchFollow } = useCustomerFollowups();
  const { data: customers = [], isLoading: loadCust } = useMyCustomers(employeeId);

  // Mutations
  const createFollowupMutation = useCreateCustomerFollowup();
  const updateFollowupMutation = useUpdateCustomerFollowup();
  const deleteFollowupMutation = useDeleteCustomerFollowup();

  // Component State
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [showForm, setShowForm] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<CustomerFollowup | null>(null);

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [fType, setFType] = useState<"Call" | "Visit" | "WhatsApp" | "Meeting" | "Other">("Call");
  const [fNextDate, setFNextDate] = useState("");
  const [fRemarks, setFRemarks] = useState("");

  const handleRefresh = async () => {
    await refetchFollow();
  };

  const handleOpenForm = (followup?: CustomerFollowup) => {
    if (followup) {
      if (followup.created_by !== employeeId) {
        toast.error("You are only permitted to edit your own follow-up interactions.");
        return;
      }
      setEditingFollowup(followup);
      setSelectedCustomerId(followup.customer_id);
      setFType(followup.followup_type);
      setFNextDate(followup.next_followup_date ? followup.next_followup_date.substring(0, 10) : "");
      setFRemarks(followup.remarks || "");
    } else {
      setEditingFollowup(null);
      setSelectedCustomerId("");
      setFType("Call");
      setFNextDate("");
      setFRemarks("");
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }

    const payload = {
      customer_id: selectedCustomerId,
      followup_type: fType,
      remarks: fRemarks || null,
      next_followup_date: fNextDate ? new Date(fNextDate).toISOString() : null,
    };

    if (editingFollowup) {
      updateFollowupMutation.mutate(
        { id: editingFollowup.id, data: payload },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Follow-up updated.");
              setShowForm(false);
              handleRefresh();
            } else {
              toast.error(res.error || "Failed to update.");
            }
          },
        }
      );
    } else {
      createFollowupMutation.mutate(
        { data: payload, createdBy: employeeId },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Follow-up logged.");
              setShowForm(false);
              handleRefresh();
            } else {
              toast.error(res.error || "Failed to log.");
            }
          },
        }
      );
    }
  };

  const handleMarkCompleted = (followup: CustomerFollowup) => {
    if (followup.created_by !== employeeId) {
      toast.error("You are only permitted to complete your own follow-up interactions.");
      return;
    }

    const payload = {
      customer_id: followup.customer_id,
      followup_type: followup.followup_type,
      remarks: followup.remarks,
      next_followup_date: null,
    };

    updateFollowupMutation.mutate(
      { id: followup.id, data: payload },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success("Follow-up completed.");
            handleRefresh();
          } else {
            toast.error(res.error || "Failed to complete.");
          }
        },
      }
    );
  };

  const handleDelete = (followup: CustomerFollowup) => {
    if (followup.created_by !== employeeId) {
      toast.error("You are only permitted to delete your own follow-up interactions.");
      return;
    }

    Alert.alert("Delete Follow-up", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFollowupMutation.mutate(followup.id, {
            onSuccess: (res) => {
              if (res.success) {
                toast.success("Follow-up deleted.");
                handleRefresh();
              } else {
                toast.error(res.error || "Failed to delete.");
              }
            },
          });
        },
      },
    ]);
  };

  // Map and calculate display priorities / status
  const processedFollowups = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    // Filter followups by employee's own items
    const myFollowups = followups.filter((f) => f.created_by === employeeId);

    return myFollowups.map((f) => {
      const cust = customers.find((c) => c.id === f.customer_id);

      let label = "Completed";
      let color = adminColors.success;

      if (f.next_followup_date) {
        const formattedNext = new Date(f.next_followup_date).toISOString().substring(0, 10);
        if (formattedNext === today) {
          label = "Due Today";
          color = "#F59E0B";
        } else if (formattedNext < today) {
          label = "Overdue";
          color = adminColors.danger;
        } else {
          label = "Upcoming";
          color = "#3B82F6";
        }
      }

      // Compute priority
      let priority = "Low";
      if (f.next_followup_date) {
        const daysLeft = Math.ceil((new Date(f.next_followup_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        priority = daysLeft <= 2 ? "High" : daysLeft <= 5 ? "Medium" : "Low";
      }

      return {
        ...f,
        customerName: cust?.full_name || "Unknown Customer",
        customerCode: cust?.customer_code || "",
        statusLabel: label,
        statusColor: color,
        priority,
      };
    });
  }, [followups, customers, employeeId]);

  const pendingList = useMemo(() => processedFollowups.filter((f) => f.next_followup_date), [processedFollowups]);
  const completedList = useMemo(() => processedFollowups.filter((f) => !f.next_followup_date), [processedFollowups]);

  const activeList = activeTab === "pending" ? pendingList : completedList;

  return (
    <Screen isLoading={loadFollow || loadCust} onRefresh={handleRefresh} refreshing={loadFollow}>
      <AppHeader title="My Follow-Ups" subtitle="Manage scheduled actions & logs" onBack={() => router.back()} />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("pending")}
          style={[styles.tabButton, activeTab === "pending" && styles.tabButtonActive]}
        >
          <AppText weight="700" color={activeTab === "pending" ? "#22C55E" : adminColors.textSecondary}>
            Pending ({pendingList.length})
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          style={[styles.tabButton, activeTab === "completed" && styles.tabButtonActive]}
        >
          <AppText weight="700" color={activeTab === "completed" ? "#22C55E" : adminColors.textSecondary}>
            Completed ({completedList.length})
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={{ padding: spacing.md }}>
        <Button title="+ Create Follow-Up" onPress={() => handleOpenForm()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        {activeList.length === 0 ? (
          <EmptyState title="No items found" />
        ) : (
          activeList.map((f) => (
            <Card key={f.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <AppText variant="body" weight="700">
                    {f.customerName}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary}>
                    {f.customerCode}
                  </AppText>
                </View>
                <Badge label={f.statusLabel} color={f.statusColor} />
              </View>

              <View style={styles.metaInfo}>
                <AppText variant="caption" color={adminColors.textSecondary}>
                  Interaction Type: <AppText variant="caption" weight="600">{f.followup_type}</AppText>
                </AppText>
                {!!f.next_followup_date && (
                  <>
                    <AppText variant="caption" color={adminColors.textSecondary}>
                      Next Scheduled: <AppText variant="caption" weight="600">{new Date(f.next_followup_date).toLocaleDateString("en-IN")}</AppText>
                    </AppText>
                    <AppText variant="caption" color={adminColors.textSecondary}>
                      Proximity Priority:{" "}
                      <AppText
                        variant="caption"
                        weight="700"
                        color={f.priority === "High" ? adminColors.danger : f.priority === "Medium" ? "#F59E0B" : adminColors.success}
                      >
                        {f.priority}
                      </AppText>
                    </AppText>
                  </>
                )}
              </View>

              {!!f.remarks && (
                <AppText variant="caption" color={adminColors.textSecondary} style={styles.remarksBox}>
                  &quot;{f.remarks}&quot;
                </AppText>
              )}

              <View style={styles.cardActions}>
                {activeTab === "pending" && (
                  <TouchableOpacity onPress={() => handleMarkCompleted(f)} style={styles.actionBtn}>
                    <Feather name="check-circle" size={13} color={adminColors.success} />
                    <AppText variant="caption" color={adminColors.success} weight="700">
                      Complete
                    </AppText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleOpenForm(f)} style={styles.actionBtn}>
                  <Feather name="edit-2" size={13} color="#F59E0B" />
                  <AppText variant="caption" color="#F59E0B" weight="700">
                    Reschedule
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(f)} style={styles.actionBtn}>
                  <Feather name="trash-2" size={13} color={adminColors.danger} />
                  <AppText variant="caption" color={adminColors.danger} weight="700">
                    Delete
                  </AppText>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.subBackdrop}>
          <View style={styles.subContent}>
            <View style={styles.header}>
              <AppText variant="h2" weight="700">
                {editingFollowup ? "Edit Follow-up" : "Log CRM Follow-up"}
              </AppText>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Feather name="x" size={20} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              <AppText weight="600" style={styles.fieldLabel}>
                Select Customer
              </AppText>
              <View style={{ marginBottom: spacing.xs }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}>
                  {customers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => !editingFollowup && setSelectedCustomerId(c.id)}
                        disabled={!!editingFollowup}
                        style={[
                          styles.selectItem,
                          isSelected && styles.selectItemActive,
                          editingFollowup && { opacity: 0.6 }
                        ]}
                      >
                        <AppText
                          variant="caption"
                          weight="600"
                          color={isSelected ? "#FFFFFF" : "#22C55E"}
                        >
                          {c.full_name} ({c.customer_code})
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <AppText weight="600" style={styles.fieldLabel}>
                Interaction Type
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {["Call", "Visit", "WhatsApp", "Meeting", "Other"].map((t) => {
                  const isSelected = fType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setFType(t as any)}
                      style={[styles.selectItem, isSelected && styles.selectItemActive]}
                    >
                      <AppText variant="caption" weight="600" color={isSelected ? "#FFFFFF" : adminColors.textSecondary}>
                        {t}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <DatePickerField
                label="Next Scheduled Follow-up"
                value={fNextDate}
                onChange={setFNextDate}
                placeholder="Select date (Optional)"
                onClear={() => setFNextDate("")}
              />
              <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: -spacing.md, marginBottom: spacing.xs }}>
                When should you contact this customer again?
              </AppText>

              <Input
                label="Remarks / Details"
                placeholder="Enter client conversation notes..."
                multiline
                numberOfLines={3}
                value={fRemarks}
                onChangeText={setFRemarks}
              />

              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Button variant="outline" title="Cancel" onPress={() => setShowForm(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Save" onPress={handleSave} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#22C55E",
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  metaInfo: {
    gap: 2,
    marginBottom: spacing.xs,
  },
  remarksBox: {
    fontStyle: "italic",
    backgroundColor: "#F8FAFC",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  subContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "80%",
    ...shadows.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: 14,
    color: adminColors.text,
  },
  selectWrapper: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  htmlSelect: {
    width: "100%",
    height: 40,
    paddingHorizontal: 8,
    borderWidth: 0,
    outline: "none",
    fontSize: 14,
    backgroundColor: "transparent",
  },
  selectItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  selectItemActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
});
