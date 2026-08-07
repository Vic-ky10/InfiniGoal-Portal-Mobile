/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useMemo, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Platform, Modal, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { useThemeColors, radius, spacing } from "@/theme";
import AppText from "./AppText";

interface DatePickerFieldProps {
  label?: string;
  value?: string; // Format: YYYY-MM-DD, YYYY-MM, YYYY or YYYY-MM-DD HH:mm:ss
  onChange: (val: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: string;
  mode?: "date" | "datetime" | "time" | "month" | "range" | "year";
  onClear?: () => void;
  isDob?: boolean;
  autoOpen?: boolean;
  onPress?: () => void;
  style?: any;
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
  isDob = false,
  autoOpen = false,
  onPress,
  style,
}: DatePickerFieldProps) {
  const colors = useThemeColors();
  const [showPicker, setShowPicker] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Parse string value (YYYY-MM-DD, YYYY-MM, YYYY or YYYY-MM-DD HH:mm:ss) into Date object
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

    // Parse YYYY-MM
    const monthMatch = value.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const year = parseInt(monthMatch[1], 10);
      const month = parseInt(monthMatch[2], 10) - 1;
      const d = new Date(year, month, 1);
      if (!isNaN(d.getTime())) return d;
    }

    // Parse YYYY
    const yearMatch = value.match(/^(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const d = new Date(year, 0, 1);
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

    if (targetMode === "year") {
      return `${year}`;
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

  // DOB Custom Modal Picker State & Calculations
  const years = useMemo(() => Array.from({ length: 107 }, (_, i) => String(2026 - i)), []);
  const months = useMemo(() => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], []);

  const [dobYear, setDobYear] = useState(() => parsedDate.getFullYear());
  const [dobMonth, setDobMonth] = useState(() => parsedDate.getMonth() + 1);
  const [dobDay, setDobDay] = useState(() => parsedDate.getDate());

  // Re-sync DOB values when value prop changes or showPicker becomes true
  const handleOpenDobModal = () => {
    setDobYear(parsedDate.getFullYear());
    setDobMonth(parsedDate.getMonth() + 1);
    setDobDay(parsedDate.getDate());
    setAndroidPickerMode("date");
    setShowPicker(true);
  };

  const daysInMonth = useMemo(() => {
    return new Date(dobYear, dobMonth, 0).getDate();
  }, [dobYear, dobMonth]);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [daysInMonth]);

  const handleConfirmDob = () => {
    // Keep day safe within the dynamic maximum days in month
    const safeDay = Math.min(dobDay, daysInMonth);
    const d = new Date(dobYear, dobMonth - 1, safeDay);
    onChange(formatDateString(d, "date"));
    setShowPicker(false);
  };

  useEffect(() => {
    if (autoOpen && !disabled) {
      if (isDob) {
        handleOpenDobModal();
      } else {
        handlePress();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, disabled]);

  return (
    <View style={StyleSheet.flatten([{ marginBottom: spacing.lg }, style])}>
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
        onPress={onPress || (isDob ? handleOpenDobModal : handlePress)}
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
            name="chevron-down"
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
          {isDob ? (
            <Modal
              visible={showPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPicker(false)}
            >
              <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={() => setShowPicker(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={[styles.dobSheet, { backgroundColor: colors.background }]}
                >
                  <View style={[styles.iosHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setShowPicker(false)} style={{ marginRight: spacing.md }}>
                      <AppText weight="600" color={colors.textSecondary}>Cancel</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirmDob}>
                      <AppText weight="700" color={colors.primary}>Confirm</AppText>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.dobColumns}>
                    {/* Year selection list */}
                    <View style={{ flex: 1.2 }}>
                      <AppText weight="700" variant="caption" style={{ alignSelf: "center", marginBottom: spacing.xs }} color={colors.textSecondary}>Year</AppText>
                      <FlatList
                        data={years}
                        keyExtractor={(item) => item}
                        initialScrollIndex={years.indexOf(String(dobYear)) !== -1 ? Math.max(0, years.indexOf(String(dobYear)) - 2) : 0}
                        getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                          const isSel = String(dobYear) === item;
                          return (
                            <TouchableOpacity
                              onPress={() => setDobYear(parseInt(item, 10))}
                              style={[styles.dobItem, isSel && { backgroundColor: colors.primary }]}
                            >
                              <AppText weight={isSel ? "700" : "500"} color={isSel ? "#FFF" : colors.text}>
                                {item}
                              </AppText>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>

                    {/* Month selection list */}
                    <View style={{ flex: 1 }}>
                      <AppText weight="700" variant="caption" style={{ alignSelf: "center", marginBottom: spacing.xs }} color={colors.textSecondary}>Month</AppText>
                      <FlatList
                        data={months}
                        keyExtractor={(item) => item}
                        initialScrollIndex={Math.max(0, dobMonth - 3)}
                        getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => {
                          const monthNum = index + 1;
                          const isSel = dobMonth === monthNum;
                          return (
                            <TouchableOpacity
                              onPress={() => setDobMonth(monthNum)}
                              style={[styles.dobItem, isSel && { backgroundColor: colors.primary }]}
                            >
                              <AppText weight={isSel ? "700" : "500"} color={isSel ? "#FFF" : colors.text}>
                                {item}
                              </AppText>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>

                    {/* Day selection list */}
                    <View style={{ flex: 1 }}>
                      <AppText weight="700" variant="caption" style={{ alignSelf: "center", marginBottom: spacing.xs }} color={colors.textSecondary}>Day</AppText>
                      <FlatList
                        data={days}
                        keyExtractor={(item) => item}
                        initialScrollIndex={days.indexOf(String(dobDay).padStart(2, "0")) !== -1 ? Math.max(0, days.indexOf(String(dobDay).padStart(2, "0")) - 2) : 0}
                        getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                          const dayNum = parseInt(item, 10);
                          const isSel = dobDay === dayNum;
                          return (
                            <TouchableOpacity
                              onPress={() => setDobDay(dayNum)}
                              style={[styles.dobItem, isSel && { backgroundColor: colors.primary }]}
                            >
                              <AppText weight={isSel ? "700" : "500"} color={isSel ? "#FFF" : colors.text}>
                                {item}
                              </AppText>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : Platform.OS === "ios" ? (
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
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  dobSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  dobColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 250,
    paddingHorizontal: spacing.md,
  },
  dobItem: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
  },
});
