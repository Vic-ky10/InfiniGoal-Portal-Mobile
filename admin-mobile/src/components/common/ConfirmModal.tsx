import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Card } from "@/components/ui";
import { adminColors, radius, spacing, shadows } from "@/theme";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <View style={styles.alertCircle}>
              <Feather name="alert-triangle" size={24} color={adminColors.danger} />
            </View>
          </View>

          <AppText variant="h2" weight="700" style={styles.title}>
            {title}
          </AppText>

          <AppText variant="body" color={adminColors.textSecondary} style={styles.message}>
            {message}
          </AppText>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={[styles.btn, styles.cancelBtn]}
            >
              <AppText weight="600" color={adminColors.textSecondary}>
                {cancelText}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[styles.btn, styles.confirmBtn]}
            >
              <AppText weight="600" color="#FFFFFF">
                {loading ? "Deleting..." : confirmText}
              </AppText>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: adminColors.border,
    ...shadows.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  alertCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  confirmBtn: {
    backgroundColor: adminColors.danger,
  },
});
