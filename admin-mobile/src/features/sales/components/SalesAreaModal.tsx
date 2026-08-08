import React, { useEffect } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppText, Button, Input } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { SalesArea } from "../sales.types";
import { salesAreaSchema, SalesAreaForm } from "../sales.validation";
import { useCreateSalesArea, useUpdateSalesArea } from "../hooks/useSales";
import { toast } from "@/store/toast.store";
import { supabase } from "@/lib/supabase/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  areaToEdit?: SalesArea | null;
}

export default function SalesAreaModal({ visible, onClose, areaToEdit }: Props) {
  const createMutation = useCreateSalesArea();
  const updateMutation = useUpdateSalesArea();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesAreaForm>({
    resolver: zodResolver(salesAreaSchema),
    defaultValues: {
      area_name: "",
      area_type: "Residential",
      address: "",
      city: "",
      state: "",
      pincode: "",
      contact_person: "",
      contact_phone: "",
      notes: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (visible) {
      if (areaToEdit) {
        reset({
          area_name: areaToEdit.area_name,
          area_type: areaToEdit.area_type,
          address: areaToEdit.address || "",
          city: areaToEdit.city || "",
          state: areaToEdit.state || "",
          pincode: areaToEdit.pincode || "",
          contact_person: areaToEdit.contact_person || "",
          contact_phone: areaToEdit.contact_phone || "",
          notes: areaToEdit.notes || "",
          status: areaToEdit.status,
        });
      } else {
        reset({
          area_name: "",
          area_type: "Residential",
          address: "",
          city: "",
          state: "",
          pincode: "",
          contact_person: "",
          contact_phone: "",
          notes: "",
          status: "Active",
        });
      }
    }
  }, [visible, areaToEdit, reset]);

  const onSubmit = async (values: SalesAreaForm) => {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;

    if (!currentUserId) {
      toast.error("User not authenticated.");
      return;
    }

    if (areaToEdit) {
      updateMutation.mutate(
        { id: areaToEdit.id, data: values },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Sales area updated successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to update sales area.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to update sales area.");
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: values, createdBy: currentUserId },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Sales area created successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to create sales area.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to create sales area.");
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
                {areaToEdit ? "Edit Sales Area" : "Add Sales Area"}
              </AppText>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Controller
              control={control}
              name="area_name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Area Name"
                  placeholder="e.g. Prestige Heights"
                  value={value}
                  onChangeText={onChange}
                  error={errors.area_name?.message}
                />
              )}
            />

            {/* area type selection */}
            <AppText weight="600" style={styles.fieldLabel}>
              Area Type
            </AppText>
            <Controller
              control={control}
              name="area_type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.selectorRow}>
                  {["Apartment", "Company", "Office", "Shop", "Residential", "Other"].map((t) => {
                    const isSelected = value === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => onChange(t)}
                        style={[
                          styles.selectorItem,
                          isSelected && styles.selectorItemActive,
                        ]}
                      >
                        <AppText
                          variant="caption"
                          weight="600"
                          color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                          style={{ fontSize: 11 }}
                        >
                          {t}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Address (Optional)"
                  placeholder="Enter full address"
                  multiline
                  numberOfLines={2}
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.address?.message}
                />
              )}
            />

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="City"
                      placeholder="Enter City "
                      value={value || ""}
                      onChangeText={onChange}
                      error={errors.city?.message}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="State"
                      placeholder="Enter state name ..."
                      value={value || ""}
                      onChangeText={onChange}
                      error={errors.state?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="pincode"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Pincode"
                  placeholder="Enter pincode "
                  keyboardType="numeric"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.pincode?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="contact_person"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Contact Person Name"
                  placeholder="Enter contact name"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.contact_person?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="contact_phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Contact Phone"
                  placeholder="Enter contact phone"
                  keyboardType="phone-pad"
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.contact_phone?.message}
                />
              )}
            />

            {/* Status Select */}
            <AppText weight="600" style={styles.fieldLabel}>
              Status
            </AppText>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.statusRow}>
                  {["Active", "Inactive"].map((statusOption) => {
                    const isSelected = value === statusOption;
                    return (
                      <TouchableOpacity
                        key={statusOption}
                        onPress={() => onChange(statusOption)}
                        style={[
                          styles.statusItem,
                          isSelected && {
                            backgroundColor: statusOption === "Active" ? adminColors.success : adminColors.textSecondary,
                            borderColor: "transparent",
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          weight="600"
                          color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                        >
                          {statusOption}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Notes"
                  placeholder="Additional notes"
                  multiline
                  numberOfLines={2}
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.notes?.message}
                />
              )}
            />

            <View style={styles.submitBtn}>
              <Button
                title={areaToEdit ? "Update Area" : "Add Area"}
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
    backgroundColor: "transparent",
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
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  selectorItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  selectorItemActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
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
