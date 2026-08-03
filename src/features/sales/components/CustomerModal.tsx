import React, { useEffect, useState } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppText, Button, Input } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { Customer } from "../sales.types";
import { customerSchema, CustomerForm } from "../sales.validation";
import { useCreateCustomer, useUpdateCustomer, useSalesAreas } from "../hooks/useSales";
import { getEmployees } from "@/features/employee/employee.service";
import { Employee } from "@/features/employee/employee.types";
import { toast } from "@/store/toast.store";
import { supabase } from "@/lib/supabase/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export default function CustomerModal({ visible, onClose, customerToEdit }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const { data: salesAreas = [], isLoading: loadingAreas } = useSalesAreas();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

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
      assigned_employee_id: "",
      status: "Active",
      notes: "",
    },
  });

  useEffect(() => {
    if (visible) {
      loadEmployees();
      if (customerToEdit) {
        reset({
          full_name: customerToEdit.full_name,
          phone: customerToEdit.phone,
          alternate_phone: customerToEdit.alternate_phone || "",
          email: customerToEdit.email || "",
          address: customerToEdit.address || "",
          sales_area_id: customerToEdit.sales_area_id,
          assigned_employee_id: customerToEdit.assigned_employee_id,
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
          assigned_employee_id: "",
          status: "Active",
          notes: "",
        });
      }
    }
  }, [visible, customerToEdit]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const onSubmit = async (data: CustomerForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser(); // wait, we need supabase to fetch logged in user
      // Let's resolve supabase profile below
    } catch(e) {}
    
    // Instead of raw supabase, let's use the mutation
    // We can fetch the authenticated user id inside the mutation or pass it.
    // Let's see: createCustomer service takes (customer, createdBy).
    // Let's get the user ID using standard supabase.auth
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;

    if (!currentUserId) {
      toast.error("User not authenticated.");
      return;
    }

    if (customerToEdit) {
      updateMutation.mutate(
        { id: customerToEdit.id, data },
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
        { data, createdBy: currentUserId },
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

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText variant="h2" weight="700">
              {customerToEdit ? "Edit Customer" : "Add Customer"}
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={adminColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
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
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
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
                  keyboardType="phone-pad"
                  value={value || ""}
                  onChangeText={onChange}
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

            {/* Assigned Staff Selection */}
            <AppText weight="600" style={styles.fieldLabel}>
              Assigned Staff
            </AppText>
            {loadingEmployees ? (
              <ActivityIndicator size="small" color={adminColors.primary} style={{ alignSelf: "flex-start", marginBottom: spacing.md }} />
            ) : (
              <Controller
                control={control}
                name="assigned_employee_id"
                render={({ field: { onChange, value } }) => (
                  <View style={{ marginBottom: spacing.md }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
                      {(employees || []).map((emp) => {
                        const isSelected = value === emp.id;
                        return (
                          <TouchableOpacity
                            key={emp.id}
                            onPress={() => onChange(emp.id)}
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
                              {emp.full_name} ({emp.employee_id})
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {errors.assigned_employee_id && (
                      <AppText variant="caption" color={adminColors.danger} style={{ marginTop: spacing.xs }}>
                        {errors.assigned_employee_id.message}
                      </AppText>
                    )}
                  </View>
                )}
              />
            )}

            {/* Status Selector */}
            <AppText weight="600" style={styles.fieldLabel}>
              Status
            </AppText>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.statusRow}>
                  {["Active", "Inactive", "Blocked"].map((statusOption) => {
                    const isSelected = value === statusOption;
                    return (
                      <TouchableOpacity
                        key={statusOption}
                        onPress={() => onChange(statusOption)}
                        style={[
                          styles.statusItem,
                          isSelected && {
                            backgroundColor:
                              statusOption === "Active"
                                ? adminColors.success
                                : statusOption === "Inactive"
                                ? adminColors.textSecondary
                                : adminColors.danger,
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
                  label="Notes (Optional)"
                  placeholder="Enter remarks or notes"
                  multiline
                  numberOfLines={3}
                  value={value || ""}
                  onChangeText={onChange}
                  error={errors.notes?.message}
                />
              )}
            />

            <View style={styles.submitBtn}>
              <Button
                title={customerToEdit ? "Update Customer" : "Add Customer"}
                loading={submitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
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
