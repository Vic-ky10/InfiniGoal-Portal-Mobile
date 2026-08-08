import React, { useEffect } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppText, Button, Input } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { IncentiveRule } from "../sales.types";
import { incentiveRuleSchema, IncentiveRuleForm } from "../sales.validation";
import { useCreateIncentiveRule, useUpdateIncentiveRule } from "../hooks/useSales";
import { toast } from "@/store/toast.store";
import { supabase } from "@/lib/supabase/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  ruleToEdit?: IncentiveRule | null;
}

export default function IncentiveRuleModal({ visible, onClose, ruleToEdit }: Props) {
  const createMutation = useCreateIncentiveRule();
  const updateMutation = useUpdateIncentiveRule();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(incentiveRuleSchema),
    defaultValues: {
      minimum_purchase: 0,
      incentive_amount: 0,
      status: "Active",
    },
  });

  useEffect(() => {
    if (visible) {
      if (ruleToEdit) {
        reset({
          minimum_purchase: ruleToEdit.minimum_purchase,
          incentive_amount: ruleToEdit.incentive_amount,
          status: ruleToEdit.status,
        });
      } else {
        reset({
          minimum_purchase: 0,
          incentive_amount: 0,
          status: "Active",
        });
      }
    }
  }, [visible, ruleToEdit, reset]);

  const onSubmit = async (values: IncentiveRuleForm) => {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;

    if (!currentUserId) {
      toast.error("User not authenticated.");
      return;
    }

    if (ruleToEdit) {
      updateMutation.mutate(
        { id: ruleToEdit.id, data: values },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Incentive rule updated successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to update rule.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to update rule.");
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: values, createdBy: currentUserId },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Incentive rule created successfully.");
              onClose();
            } else {
              toast.error(res.error || "Failed to create rule.");
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to create rule.");
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
                {ruleToEdit ? "Edit Incentive Rule" : "Add Incentive Rule"}
              </AppText>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={adminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Controller
              control={control}
              name="minimum_purchase"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Minimum Purchase Amount (₹)"
                  placeholder="e.g. 20000"
                  keyboardType="numeric"
                  value={value ? String(value) : ""}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    onChange(isNaN(parsed) ? 0 : parsed);
                  }}
                  error={errors.minimum_purchase?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="incentive_amount"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Incentive Payout Amount (₹)"
                  placeholder="e.g. 1000"
                  keyboardType="numeric"
                  value={value ? String(value) : ""}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    onChange(isNaN(parsed) ? 0 : parsed);
                  }}
                  error={errors.incentive_amount?.message}
                />
              )}
            />

            {/* Status Selector */}
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

            <View style={styles.submitBtn}>
              <Button
                title={ruleToEdit ? "Update Rule" : "Add Rule"}
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
