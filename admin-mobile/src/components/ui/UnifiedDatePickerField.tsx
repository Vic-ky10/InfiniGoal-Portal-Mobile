import React, { useState, useMemo } from "react";
import { View } from "react-native";
import { ActionSheet, ActionSheetOption } from "@/components/common";
import DatePickerField from "./DatePickerField";

interface UnifiedDatePickerFieldProps {
  label?: string;
  placeholder?: string;
  dateValue?: string;
  monthValue?: string;
  yearValue?: string;
  onChange: (type: "date" | "month" | "year" | "clear", value: string) => void;
  style?: any;
}

export default function UnifiedDatePickerField({
  label = "Date Filter",
  placeholder = "Select type...",
  dateValue,
  monthValue,
  yearValue,
  onChange,
  style,
}: UnifiedDatePickerFieldProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<"date" | "month" | "year" | null>(null);

  const displayValue = useMemo(() => {
    if (dateValue) return `Date: ${dateValue}`;
    if (monthValue) return `Month: ${monthValue}`;
    if (yearValue) return `Year: ${yearValue}`;
    return "";
  }, [dateValue, monthValue, yearValue]);

  const handleSelectType = (type: "date" | "month" | "year") => {
    setSheetVisible(false);
    setTimeout(() => {
      setActivePicker(type);
    }, 250);
  };

  const handleClear = () => {
    onChange("clear", "");
  };

  const handlePickerChange = (val: string) => {
    if (activePicker) {
      onChange(activePicker, val);
    }
    setActivePicker(null);
  };

  const options: ActionSheetOption[] = [
    { label: "📅 Exact Date", onPress: () => handleSelectType("date") },
    { label: "📆 Month", onPress: () => handleSelectType("month") },
    { label: "🗓️ Year", onPress: () => handleSelectType("year") },
  ];

  return (
    <View style={style}>
      <DatePickerField
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onClear={displayValue ? handleClear : undefined}
        onPress={() => setSheetVisible(true)}
        onChange={() => {}}
      />

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Select Date Filter Type"
        options={options}
      />

      {activePicker === "date" && (
        <DatePickerField
          value={dateValue}
          mode="date"
          onChange={handlePickerChange}
          autoOpen={true}
          style={{ display: "none" }}
        />
      )}
      {activePicker === "month" && (
        <DatePickerField
          value={monthValue}
          mode="month"
          onChange={handlePickerChange}
          autoOpen={true}
          style={{ display: "none" }}
        />
      )}
      {activePicker === "year" && (
        <DatePickerField
          value={yearValue}
          mode="year"
          onChange={handlePickerChange}
          autoOpen={true}
          style={{ display: "none" }}
        />
      )}
    </View>
  );
}
