import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useThemeColors, spacing, radius } from "@/theme";
import AppText from "../ui/AppText";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  icon?: string | React.ReactNode;
  isDestructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  options: ActionSheetOption[];
  cancelText?: string;
}

export default function ActionSheet({
  visible,
  onClose,
  title,
  subtitle,
  options,
  cancelText = "Cancel",
}: ActionSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const renderOptionIcon = (icon: string | React.ReactNode, isDestructive?: boolean) => {
    if (!icon) return null;
    if (typeof icon === "string") {
      // Check if it's an emoji (roughly matches emoji ranges including basic symbols like 👥, ✏️, 🗑, 📄, ➕, ✔, ❌)
      const isEmoji = /\p{Emoji}/u.test(icon);
      if (isEmoji) {
        return (
          <AppText style={[styles.iconStyle, { fontSize: 18 }]}>
            {icon}
          </AppText>
        );
      }
      return (
        <Feather
          name={icon as any}
          size={18}
          color={isDestructive ? colors.danger : colors.textSecondary}
          style={styles.iconStyle}
        />
      );
    }
    return icon;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.background,
                  paddingBottom: Math.max(insets.bottom, spacing.lg),
                },
              ]}
            >
              {/* Drag Indicator */}
              <View style={[styles.indicator, { backgroundColor: colors.border }]} />

              {/* Title & Subtitle */}
              {(title || subtitle) && (
                <View style={styles.header}>
                  {title && (
                    <AppText variant="title" weight="700" color={colors.text} style={styles.title}>
                      {title}
                    </AppText>
                  )}
                  {subtitle && (
                    <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
                      {subtitle}
                    </AppText>
                  )}
                </View>
              )}

              {/* Options List */}
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {options.map((option, index) => {
                  const handleOptionPress = () => {
                    onClose();
                    // Small delay to ensure modal close animation does not conflict with subsequent navigation/UI actions
                    setTimeout(() => {
                      option.onPress();
                    }, 50);
                  };

                  return (
                    <TouchableOpacity
                      key={`${option.label}-${index}`}
                      style={[
                        styles.optionButton,
                        {
                          borderBottomWidth: index === options.length - 1 ? 0 : 1,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={handleOptionPress}
                    >
                      <View style={styles.optionContent}>
                        {renderOptionIcon(option.icon, option.isDestructive)}
                        <AppText
                          variant="body"
                          weight="500"
                          color={option.isDestructive ? colors.danger : colors.text}
                          style={styles.optionText}
                        >
                          {option.label}
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText variant="body" weight="600" color={colors.textSecondary}>
                  {cancelText}
                </AppText>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    maxHeight: "80%",
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
    marginBottom: spacing.xs,
  },
  title: {
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
  },
  scrollContainer: {
    maxHeight: 350,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
  },
  optionButton: {
    paddingVertical: spacing.lg,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  iconStyle: {
    marginRight: spacing.md,
    width: 24,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
