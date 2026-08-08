import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppText, Button, Input, DatePickerField } from "@/components/ui";
import { adminColors, radius, spacing, shadows } from "@/theme";
import { Customer, SalesArea, CustomerFollowup } from "../sales.types";
import { customerSchema, CustomerForm } from "../sales.validation";
import {
  useCreateCustomer,
  useUpdateCustomer,
  useCustomerPurchases,
  useCustomerFollowups,
  useCreateCustomerFollowup,
  useUpdateCustomerFollowup,
  useDeleteCustomerFollowup
} from "../hooks/useSales";
import { toast } from "@/store/toast.store";
import { supabase } from "@/lib/supabase/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  employeeId: string;       // Logged-in employee's auth.uid() — auto-set, never editable
  salesAreas: SalesArea[];  // Scoped to this employee
  loadingAreas?: boolean;
  initialTab?: "info" | "purchases" | "followups";
  highlightFollowupId?: string | null;
}

export default function EmployeeCustomerModal({
  visible,
  onClose,
  customerToEdit,
  employeeId,
  salesAreas,
  loadingAreas = false,
  initialTab = "info",
  highlightFollowupId
}: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "purchases" | "followups">("info");

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  // Followups and Purchases queries
  const { data: allPurchases = [] } = useCustomerPurchases();
  const { data: allFollowups = [] } = useCustomerFollowups();

  const createFollowupMutation = useCreateCustomerFollowup();
  const updateFollowupMutation = useUpdateCustomerFollowup();
  const deleteFollowupMutation = useDeleteCustomerFollowup();

  // Followup form overlay state
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<CustomerFollowup | null>(null);
  const [fDate, setFDate] = useState("");
  const [fType, setFType] = useState<"Call" | "Visit" | "WhatsApp" | "Meeting" | "Other">("Call");
  const [fRemarks, setFRemarks] = useState("");
  const [fNextDate, setFNextDate] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      alternate_phone: "",
      email: "",
      address: "",
      sales_area_id: "",
      assigned_employee_id: employeeId,
      status: "Active",
      notes: "",
    },
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (visible) {
      setActiveTab(customerToEdit ? initialTab : "info");
      if (customerToEdit) {
        reset({
          full_name: customerToEdit.full_name,
          phone: customerToEdit.phone,
          alternate_phone: customerToEdit.alternate_phone || "",
          email: customerToEdit.email || "",
          address: customerToEdit.address || "",
          sales_area_id: customerToEdit.sales_area_id,
          assigned_employee_id: employeeId, // Always force to current employee
          status: customerToEdit.status,
          notes: customerToEdit.notes || "",
        });
      } else {
        reset({
          full_name: "",
          phone: "",
          alternate_phone: "",
          email: "",
          address: "",
          sales_area_id: "",
          assigned_employee_id: employeeId, // Always force to current employee
          status: "Active",
          notes: "",
        });
      }
    }
  }, [visible, customerToEdit, employeeId, initialTab, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const customerPurchases = useMemo(() => {
    if (!customerToEdit) return [];
    return allPurchases
      .filter((p) => p.customer_id === customerToEdit.id)
      .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
  }, [allPurchases, customerToEdit]);

  const customerFollowups = useMemo(() => {
    if (!customerToEdit) return [];
    return allFollowups
      .filter((f) => f.customer_id === customerToEdit.id)
      .sort((a, b) => new Date(b.followup_date).getTime() - new Date(a.followup_date).getTime());
  }, [allFollowups, customerToEdit]);

  const onSubmit = async (data: CustomerForm) => {
    const payload: CustomerForm = {
      ...data,
      assigned_employee_id: employeeId,
    };

    if (customerToEdit) {
      updateMutation.mutate(
        { id: customerToEdit.id, data: payload },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Customer updated successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to update customer.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to update customer.");
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload, createdBy: employeeId },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Customer created successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to create customer.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to create customer.");
          },
        }
      );
    }
  };

  // Followup Actions (Scoped to employeeId)
  const handleOpenFollowupForm = (followup: CustomerFollowup | null = null) => {
    if (followup) {
      // Permission Check: only edit own followups
      if (followup.created_by !== employeeId) {
        toast.error("You are only permitted to edit your own follow-up interactions.");
        return;
      }
      setEditingFollowup(followup);
      setFDate(followup.followup_date ? new Date(followup.followup_date).toISOString().split("T")[0] : "");
      setFType(followup.followup_type);
      setFRemarks(followup.remarks || "");
      setFNextDate(followup.next_followup_date ? new Date(followup.next_followup_date).toISOString().split("T")[0] : "");
    } else {
      setEditingFollowup(null);
      setFDate(new Date().toISOString().split("T")[0]);
      setFType("Call");
      setFRemarks("");
      setFNextDate("");
    }
    setShowFollowupForm(true);
  };

  const handleFollowupSubmit = async () => {
    if (!customerToEdit) return;
    if (!fDate) {
      toast.error("Please enter a follow-up date.");
      return;
    }

    const payload = {
      customer_id: customerToEdit.id,
      followup_date: new Date(fDate).toISOString(),
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
              toast.success("Follow-up updated successfully.");
              setShowFollowupForm(false);
            } else {
              toast.error(res.error || "Failed to update follow-up.");
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
              toast.success("Follow-up logged successfully.");
              setShowFollowupForm(false);
            } else {
              toast.error(res.error || "Failed to log follow-up.");
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
      followup_date: followup.followup_date,
      followup_type: followup.followup_type,
      remarks: followup.remarks,
      next_followup_date: null,
    };

    updateFollowupMutation.mutate(
      { id: followup.id, data: payload },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success("Follow-up marked as completed.");
          } else {
            toast.error(res.error || "Failed to complete follow-up.");
          }
        },
      }
    );
  };

  const handleFollowupDelete = (followup: CustomerFollowup) => {
    if (followup.created_by !== employeeId) {
      toast.error("You are only permitted to delete your own follow-up interactions.");
      return;
    }
    Alert.alert("Delete Follow-up", "Are you sure you want to delete this follow-up record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFollowupMutation.mutate(followup.id, {
            onSuccess: (res) => {
              if (res.success) {
                toast.success("Follow-up deleted successfully.");
              } else {
                toast.error(res.error || "Failed to delete follow-up.");
              }
            },
          });
        },
      },
    ]);
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.backdrop}>
          <View style={styles.content}>
            <View style={styles.header}>
              <AppText variant="h2" weight="700">
                {customerToEdit ? customerToEdit.full_name : "Add Customer"}
              </AppText>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Segmented Tab Bar if editing an existing customer */}
            {customerToEdit && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  onPress={() => setActiveTab("info")}
                  style={[styles.tabButton, activeTab === "info" && styles.tabButtonActive]}
                >
                  <AppText variant="caption" weight="700" color={activeTab === "info" ? adminColors.primary : adminColors.textSecondary}>
                    Profile Info
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab("purchases")}
                  style={[styles.tabButton, activeTab === "purchases" && styles.tabButtonActive]}
                >
                  <AppText variant="caption" weight="700" color={activeTab === "purchases" ? adminColors.primary : adminColors.textSecondary}>
                    Purchases ({customerPurchases.length})
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab("followups")}
                  style={[styles.tabButton, activeTab === "followups" && styles.tabButtonActive]}
                >
                  <AppText variant="caption" weight="700" color={activeTab === "followups" ? adminColors.primary : adminColors.textSecondary}>
                    Follow-ups ({customerFollowups.length})
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === "info" && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
                <Controller
                  control={control}
                  name="full_name"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Full Name"
                      placeholder="Enter full name"
                      value={value}
                      onChangeText={onChange}
                      error={errors.full_name?.message}
                    />
                  )}
                />                 <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Phone Number"
                      placeholder="Enter phone number"
                      keyboardType="numeric"
                      maxLength={10}
                      value={value}
                      onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                      error={errors.phone?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="alternate_phone"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Alternate Phone (Optional)"
                      placeholder="Enter alternate phone"
                      keyboardType="numeric"
                      maxLength={10}
                      value={value || ""}
                      onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                      error={errors.alternate_phone?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Email (Optional)"
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value || ""}
                      onChangeText={onChange}
                      error={errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Address (Optional)"
                      placeholder="Enter address"
                      multiline
                      numberOfLines={2}
                      value={value || ""}
                      onChangeText={onChange}
                      error={errors.address?.message}
                    />
                  )}
                />

                {/* Sales Area Selection */}
                <AppText weight="600" style={styles.fieldLabel}>
                  Sales Area
                </AppText>
                {loadingAreas ? (
                  <ActivityIndicator size="small" color={adminColors.primary} style={{ alignSelf: "flex-start", marginBottom: spacing.md }} />
                ) : (
                  <Controller
                    control={control}
                    name="sales_area_id"
                    render={({ field: { onChange, value } }) => (
                      <View style={{ marginBottom: spacing.md }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
                          {(salesAreas || []).map((area) => {
                            const isSelected = value === area.id;
                            return (
                              <TouchableOpacity
                                key={area.id}
                                onPress={() => onChange(area.id)}
                                style={[
                                  styles.selectItem,
                                  isSelected && styles.selectItemActive,
                                ]}
                              >
                                <AppText
                                  variant="caption"
                                  weight="600"
                                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                                >
                                  {area.area_name} ({area.area_code})
                                </AppText>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        {errors.sales_area_id && (
                          <AppText variant="caption" color={adminColors.danger} style={{ marginTop: spacing.xs }}>
                            {errors.sales_area_id.message}
                          </AppText>
                        )}
                      </View>
                    )}
                  />
                )}

                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Customer Notes"
                      placeholder="Add profile details or customer descriptions..."
                      multiline
                      numberOfLines={3}
                      value={value || ""}
                      onChangeText={onChange}
                      error={errors.notes?.message}
                    />
                  )}
                />

                <View style={styles.footer}>
                  <View style={{ flex: 1 }}>
                    <Button variant="outline" title="Cancel" onPress={onClose} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={customerToEdit ? "Save Changes" : "Create Customer"}
                      onPress={handleSubmit(onSubmit)}
                      loading={submitting}
                    />
                  </View>
                </View>
              </ScrollView>
            )}

            {activeTab === "purchases" && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timelineContainer}>
                {customerPurchases.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <AppText variant="body" color={adminColors.textSecondary}>
                      No transactions recorded for this client.
                    </AppText>
                  </View>
                ) : (
                  customerPurchases.map((p) => (
                    <Card key={p.id} style={styles.timelineCard}>
                      <View style={styles.timelineCardHeader}>
                        <AppText variant="body" weight="700">{p.purchase_code}</AppText>
                        <AppText variant="body" weight="700" color={adminColors.primary}>
                          ₹{p.amount.toLocaleString("en-IN")}
                        </AppText>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs }}>
                        <AppText variant="caption" color={adminColors.textSecondary}>
                          {new Date(p.purchase_date).toLocaleDateString("en-IN")}
                        </AppText>
                        <AppText variant="caption" weight="600" color={p.status === "Approved" ? adminColors.success : adminColors.danger}>
                          {p.status}
                        </AppText>
                      </View>
                    </Card>
                  ))
                )}
              </ScrollView>
            )}

            {activeTab === "followups" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timelineContainer}>
                  <View style={{ marginBottom: spacing.md }}>
                    <Button
                      title="+ Log Customer Follow-up"
                      onPress={() => handleOpenFollowupForm()}
                    />
                  </View>

                  {customerFollowups.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <AppText variant="body" color={adminColors.textSecondary}>
                        No follow-up actions logged yet.
                      </AppText>
                    </View>
                  ) : (
                    <View style={{ gap: spacing.lg }}>
                      {/* Upcoming scheduled section */}
                      {(() => {
                        const upcoming = customerFollowups.filter((f) => f.next_followup_date);
                        if (upcoming.length === 0) return null;
                        return (
                          <View style={{ gap: spacing.sm }}>
                            <AppText variant="caption" weight="700" color={adminColors.text} style={{ textTransform: "uppercase", letterSpacing: 1 }}>
                              📅 Upcoming Scheduled Actions
                            </AppText>
                            {upcoming.map((f) => {
                              const isHighlighted = highlightFollowupId === f.id;
                              const isOwnFollowup = f.created_by === employeeId;
                              const today = new Date().toISOString().substring(0, 10);
                              const formattedNext = new Date(f.next_followup_date!).toISOString().substring(0, 10);
                              let label = "Upcoming";
                              let color = "#3B82F6";
                              if (formattedNext === today) {
                                label = "Due Today";
                                color = "#F59E0B";
                              } else if (formattedNext < today) {
                                label = "Overdue";
                                color = adminColors.danger;
                              }

                              return (
                                <Card key={`up-${f.id}`} style={[styles.timelineCard, isHighlighted && styles.highlightedCard]}>
                                  <View style={styles.timelineCardHeader}>
                                    <AppText variant="body" weight="700">
                                      Next Date: {new Date(f.next_followup_date!).toLocaleDateString("en-IN")}
                                    </AppText>
                                    <Badge label={label} color={color} />
                                  </View>
                                  <AppText variant="caption" color={adminColors.textSecondary} style={{ marginTop: 2 }}>
                                    Scheduled from {f.followup_type} on {new Date(f.followup_date).toLocaleDateString("en-IN")}
                                  </AppText>
                                  {isOwnFollowup && (
                                    <View style={styles.cardActions}>
                                      <TouchableOpacity onPress={() => handleMarkCompleted(f)} style={styles.actionBtn}>
                                        <Feather name="check-circle" size={13} color={adminColors.success} />
                                        <AppText variant="caption" color={adminColors.success} weight="700">Complete</AppText>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => handleOpenFollowupForm(f)} style={styles.actionBtn}>
                                        <Feather name="edit-2" size={13} color="#F59E0B" />
                                        <AppText variant="caption" color="#F59E0B" weight="700">Edit</AppText>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => handleFollowupDelete(f)} style={styles.actionBtn}>
                                        <Feather name="trash-2" size={13} color={adminColors.danger} />
                                        <AppText variant="caption" color={adminColors.danger} weight="700">Delete</AppText>
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </Card>
                              );
                            })}
                          </View>
                        );
                      })()}

                      {/* Completed Interactions section */}
                      <View style={{ gap: spacing.sm }}>
                        <AppText variant="caption" weight="700" color={adminColors.text} style={{ textTransform: "uppercase", letterSpacing: 1 }}>
                          📞 Completed Interactions
                        </AppText>
                        {customerFollowups.map((f) => {
                          const isHighlighted = highlightFollowupId === f.id;
                          const isOwnFollowup = f.created_by === employeeId;
                          return (
                            <Card key={`comp-${f.id}`} style={[styles.timelineCard, isHighlighted && styles.highlightedCard]}>
                              <View style={styles.timelineCardHeader}>
                                <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
                                  <AppText variant="body" weight="700">
                                    Interaction: {new Date(f.followup_date).toLocaleDateString("en-IN")}
                                  </AppText>
                                  <Badge label={f.followup_type} color={adminColors.primary} />
                                </View>
                                <Badge label="Completed" color={adminColors.success} />
                              </View>
                              {!!f.remarks && (
                                <AppText variant="caption" color={adminColors.textSecondary} style={styles.remarksBox}>
                                  &quot;{f.remarks}&quot;
                                </AppText>
                              )}
                              {isOwnFollowup && (
                                <View style={styles.cardActions}>
                                  <TouchableOpacity onPress={() => handleOpenFollowupForm(f)} style={styles.actionBtn}>
                                    <Feather name="edit-2" size={13} color="#F59E0B" />
                                    <AppText variant="caption" color="#F59E0B" weight="700">Edit</AppText>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleFollowupDelete(f)} style={styles.actionBtn}>
                                    <Feather name="trash-2" size={13} color={adminColors.danger} />
                                    <AppText variant="caption" color={adminColors.danger} weight="700">Delete</AppText>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </Card>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Followup Log Form Modal Overlay */}
      <Modal visible={showFollowupForm} animationType="fade" transparent>
        <View style={styles.subBackdrop}>
          <View style={styles.subContent}>
            <View style={styles.header}>
              <AppText variant="h2" weight="700">
                {editingFollowup ? "Edit Follow-up" : "Log CRM Follow-up"}
              </AppText>
              <TouchableOpacity onPress={() => setShowFollowupForm(false)}>
                <Feather name="x" size={20} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>

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
                  <Button variant="outline" title="Cancel" onPress={() => setShowFollowupForm(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Save" onPress={handleFollowupSubmit} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const Badge = ({ label, color }: { label: string; color?: string }) => (
  <View style={{ backgroundColor: `${color || adminColors.primary}15`, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 2 }}>
    <AppText variant="caption" weight="700" color={color || adminColors.primary} style={{ fontSize: 10 }}>
      {label}
    </AppText>
  </View>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  content: {
    height: "85%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: adminColors.primary,
  },
  form: {
    paddingBottom: spacing.xl,
  },
  timelineContainer: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  timelineCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  timelineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  highlightedCard: {
    borderColor: adminColors.primary,
    backgroundColor: `${adminColors.primary}05`,
  },
  remarksBox: {
    marginTop: spacing.xs,
    fontStyle: "italic",
    backgroundColor: "#F8FAFC",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.xs,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fieldLabel: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectorScroll: {
    gap: spacing.sm,
  },
  selectItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  selectItemActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.sm,
  },
});
