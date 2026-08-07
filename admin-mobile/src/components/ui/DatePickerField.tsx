import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { useThemeColors, radius, spacing } from "@/theme";
import AppText from "./AppText";

interface DatePickerFieldProps {
  label?: string;
  value?: string; // Format: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  onChange: (val: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: string;
  mode?: "date" | "datetime" | "time" | "month" | "range";
  onClear?: () => void;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
  disabled = false,
  error,
  mode = "date",
  onClear,
}: DatePickerFieldProps) {
  const colors = useThemeColors();
  const [showPicker, setShowPicker] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Parse string value (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss) into Date object
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    
    // Parse YYYY-MM-DD HH:mm:ss
    const dateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (dateTimeMatch) {
      const year = parseInt(dateTimeMatch[1], 10);
      const month = parseInt(dateTimeMatch[2], 10) - 1;
      const day = parseInt(dateTimeMatch[3], 10);
      const hours = parseInt(dateTimeMatch[4], 10);
      const minutes = parseInt(dateTimeMatch[5], 10);
      const seconds = parseInt(dateTimeMatch[6], 10);
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    // Parse YYYY-MM-DD
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    const fallback = new Date(value);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }, [value]);

  // Format Date object back to required string format
  const formatDateString = (d: Date, targetMode: typeof mode) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    if (targetMode === "datetime") {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    if (targetMode === "month") {
      return `${year}-${month}`;
    }

    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowPicker(false);
        setTempDate(null);
        return;
      }

      if (selectedDate) {
        if (mode === "datetime" && androidPickerMode === "date") {
          // Store date part and show time picker next
          setTempDate(selectedDate);
          setAndroidPickerMode("time");
        } else if (mode === "datetime" && androidPickerMode === "time" && tempDate) {
          // Combine date from tempDate and time from selectedDate
          const combinedDate = new Date(
            tempDate.getFullYear(),
            tempDate.getMonth(),
            tempDate.getDate(),
            selectedDate.getHours(),
            selectedDate.getMinutes(),
            selectedDate.getSeconds()
          );
          setShowPicker(false);
          onChange(formatDateString(combinedDate, "datetime"));
          setTempDate(null);
        } else {
          // Single picker mode (date)
          setShowPicker(false);
          onChange(formatDateString(selectedDate, mode));
        }
      }
    } else {
      
      if (selectedDate) {
        onChange(formatDateString(selectedDate, mode));
      }
    }
  };

  const handlePress = () => {
    if (disabled) return;
    setAndroidPickerMode("date");
    setShowPicker(true);
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label && (
        <AppText
          weight="600"
          style={{ marginBottom: spacing.xs, fontSize: 13 }}
          color={colors.textSecondary}
        >
          {label}
        </AppText>
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.75}
        style={[
          {
            height: 52,
            borderWidth: 1.5,
            borderColor: error
              ? colors.danger
              : showPicker
              ? colors.primary
              : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: disabled ? "#F1F5F9" : colors.background,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        ]}
      >
        <AppText
          style={{ fontSize: 15 }}
          color={disabled ? colors.disabled : value ? colors.text : colors.textSecondary}
        >
          {value || placeholder}
        </AppText>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {onClear && value && !disabled && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onClear();
              }}
              style={{ padding: spacing.xs }}
            >
              <Feather name="x" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
          <Feather
            name="calendar"
            size={16}
            color={disabled ? colors.disabled : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {error && (
        <AppText
          variant="caption"
          color={colors.danger}
          style={{ marginTop: spacing.xs }}
        >
          {error}
        </AppText>
      )}

      {showPicker && (
        <>
          {Platform.OS === "ios" ? (
            <View style={styles.iosContainer}>
              <View style={[styles.iosHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <AppText weight="700" color={colors.primary}>Done</AppText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parsedDate}
                mode={mode === "datetime" ? "datetime" : "date"}
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={handleDateChange}
              />
            </View>
          ) : (
            <DateTimePicker
              value={androidPickerMode === "time" && tempDate ? tempDate : parsedDate}
              mode={androidPickerMode}
              display="default"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={handleDateChange}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iosContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingBottom: spacing.lg,
  },
  iosHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: spacing.sm,
    borderBottomWidth: 1,
  },
});
