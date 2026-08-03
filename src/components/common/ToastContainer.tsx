import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Animated, Dimensions, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useToastStore, ToastMessage } from "@/store/toast.store";
import { AppText } from "@/components/ui";
import { adminColors, radius, spacing, shadows } from "@/theme";

const { width } = Dimensions.get("window");

function ToastItem({ toast }: { toast: ToastMessage }) {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(-20), []);
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -15,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      removeToast(toast.id);
    });
  };

  const isSuccess = toast.type === "success";
  const bgColor = isSuccess ? "#F0FDF4" : "#FEF2F2";
  const borderColor = isSuccess ? "#BBF7D0" : "#FCA5A5";
  const iconColor = isSuccess ? adminColors.success : adminColors.danger;
  const iconName = isSuccess ? "check-circle" : "alert-circle";

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
      ]}
    >
      <Feather name={iconName} size={18} color={iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        <AppText variant="caption" weight="600" color={adminColors.text}>
          {toast.message}
        </AppText>
      </View>
      <Pressable onPress={handleDismiss} style={styles.closeBtn}>
        <Feather name="x" size={14} color={adminColors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  toastItem: {
    flexDirection: "row",
    alignItems: "center",
    width: width - spacing.xl * 2,
    maxWidth: 450,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
