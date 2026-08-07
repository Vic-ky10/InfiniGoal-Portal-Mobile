import React, { useEffect } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppText, Button, Input, DatePickerField } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { CustomerPurchase } from "../sales.types";
import { customerPurchaseSchema, CustomerPurchaseForm } from "../sales.validation";
import { useCreateCustomerPurchase, useUpdateCustomerPurchase, useCustomers } from "../hooks/useSales";
import { parsePurchaseRemarks } from "../sales.utils";
import { toast } from "@/store/toast.store";
import { supabase } from "@/lib/supabase/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  purchaseToEdit?: CustomerPurchase | null;
  showAdminReview?: boolean;
}

function formatDateToString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PurchaseModal({ visible, onClose, purchaseToEdit, showAdminReview = true }: Props) {
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const createMutation = useCreateCustomerPurchase();
  const updateMutation = useUpdateCustomerPurchase();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerPurchaseSchema),
    defaultValues: {
      customer_id: "",
      amount: 0,
      purchase_date: formatDateToString(new Date()),
      remarks: "",
      status: "Pending",
      incentive_status: "Not Eligible",
    },
  });

  useEffect(() => {
    if (visible) {
      if (purchaseToEdit) {
        const meta = parsePurchaseRemarks(purchaseToEdit.remarks, purchaseToEdit.status);
        const parsedDate = purchaseToEdit.purchase_date ? new Date(purchaseToEdit.purchase_date) : new Date();

        reset({
          customer_id: purchaseToEdit.customer_id,
          amount: purchaseToEdit.amount,
          purchase_date: formatDateToString(parsedDate),
          remarks: meta.remarks,
          status: purchaseToEdit.status === "Not Eligible" ? "Approved" : purchaseToEdit.status,
          incentive_status: meta.incentive_status,
        });
      } else {
        const todayStr = formatDateToString(new Date());
        reset({
          customer_id: "",
          amount: 0,
          purchase_date: todayStr,
          remarks: "",
          status: "Pending",
          incentive_status: "Not Eligible",
        });
      }
    }
  }, [visible, purchaseToEdit, reset]);

  const onSubmit = async (values: CustomerPurchaseForm) => {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;

    if (!currentUserId) {
      toast.error("User not authenticated.");
      return;
    }

    if (purchaseToEdit) {
      updateMutation.mutate(
         { id: purchaseToEdit.id, data: values, adminReviewedBy: currentUserId },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Purchase record updated successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to update purchase.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to update purchase.");
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: values, createdBy: currentUserId },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Purchase recorded successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to log purchase.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to log purchase.");
          },
        }
      );
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.backdrop}>
          <View style={styles.content}>
            <View style={styles.header}>
              <AppText variant="h2" weight="700">
                {purchaseToEdit ? "Edit Purchase" : "Log New Purchase"}
              </AppText>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            {/* Customer Selection */}
            <AppText weight="600" style={styles.fieldLabel}>
              Customer
            </AppText>
            {loadingCustomers ? (
              <ActivityIndicator size="small" color={adminColors.primary} style={{ alignSelf: "flex-start", marginBottom: spacing.md }} />
            ) : (
              <Controller
                control={control}
                name="customer_id"
                render={({ field: { onChange, value } }) => (
                  <View style={{ marginBottom: spacing.md }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.selectorScroll}
                    >
                      {customers.map((c) => {
                        const isSelected = value === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            disabled={!!purchaseToEdit}
                            onPress={() => onChange(c.id)}
                            style={[
                              styles.selectItem,
                              isSelected && styles.selectItemActive,
                              !!purchaseToEdit && { opacity: 0.6 },
                            ]}
                          >
                            <AppText
                              variant="caption"
                              weight="600"
                              color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                            >
                              {c.full_name} ({c.customer_code})
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {errors.customer_id && (
                      <AppText variant="caption" color={adminColors.danger} style={{ marginTop: spacing.xs }}>
                        {errors.customer_id.message}
                      </AppText>
                    )}
                  </View>
                )}
              />
            )}

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Purchase Amount (₹)"
                  placeholder="e.g. 15000"
                  keyboardType="numeric"
                  value={value ? String(value) : ""}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    onChange(isNaN(parsed) ? 0 : parsed);
                  }}
                  error={errors.amount?.message}
                />
              )}
            />

            {/* Date Field */}
            <Controller
              control={control}
              name="purchase_date"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  label="Purchase Date"
                  value={value}
                  onChange={onChange}
                  error={errors.purchase_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="remarks"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Remarks (Optional)"
                  placeholder="e.g. invoice items, notes"
                  multiline
                  numberOfLines={2}
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.remarks?.message}
                />
              )}
            />

            {/* Edit Mode Status Management (Admin Only) */}
            {showAdminReview && purchaseToEdit && (
              <View style={styles.editStatusContainer}>
                <AppText weight="700" style={{ fontSize: 13, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5, color: adminColors.textSecondary }}>
                  Admin Status Review
                </AppText>
                
                {/* Purchase Status */}
                <AppText weight="600" style={[styles.fieldLabel, { marginTop: spacing.xs }]}>
                  Purchase Status
                </AppText>
                <Controller
                  control={control}
                  name="status"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.statusRow}>
                      {["Pending", "Approved", "Rejected"].map((opt) => {
                        const isSelected = value === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => onChange(opt)}
                            style={[
                              styles.statusItem,
                              isSelected && {
                                backgroundColor: opt === "Approved" ? adminColors.success : opt === "Pending" ? adminColors.warning : adminColors.danger,
                                borderColor: "transparent",
                              },
                            ]}
                          >
                            <AppText variant="caption" weight="600" color={isSelected ? "#FFFFFF" : adminColors.textSecondary}>
                              {opt}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                />

                {/* Incentive Status */}
                <AppText weight="600" style={[styles.fieldLabel, { marginTop: spacing.sm }]}>
                  Incentive Status
                </AppText>
                <Controller
                  control={control}
                  name="incentive_status"
                  render={({ field: { onChange, value } }) => (
                    <View style={[styles.statusRow, { flexWrap: "wrap" }]}>
                      {["Not Eligible", "Eligible", "Pending Review", "Approved", "Rejected"].map((opt) => {
                        const isSelected = value === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => onChange(opt)}
                            style={[
                              styles.statusItem,
                              { minWidth: "30%", marginBottom: spacing.xs },
                              isSelected && {
                                backgroundColor: opt === "Approved" ? adminColors.success : (opt === "Pending Review" || opt === "Eligible") ? adminColors.warning : adminColors.textSecondary,
                                borderColor: "transparent",
                              },
                            ]}
                          >
                            <AppText variant="caption" weight="600" color={isSelected ? "#FFFFFF" : adminColors.textSecondary} style={{ fontSize: 10, textAlign: "center" }}>
                              {opt}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                />
              </View>
            )}

            <View style={styles.submitBtn}>
              <Button
                title={purchaseToEdit ? "Save Changes" : "Log Purchase"}
                loading={submitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: adminColors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.sm,
  },

  fieldLabel: {
    fontSize: 13,
    color: adminColors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectorScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  selectItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  selectItemActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  dateField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.surface,
    marginBottom: spacing.sm,
  },
  editStatusContainer: {
    backgroundColor: adminColors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.surface,
    alignItems: "center",
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
