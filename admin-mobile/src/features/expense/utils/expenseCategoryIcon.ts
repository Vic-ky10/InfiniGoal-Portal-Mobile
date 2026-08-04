import React from "react";
import { Feather } from "@expo/vector-icons";

export function getCategoryIconName(category?: string): React.ComponentProps<typeof Feather>["name"] {
  if (!category) return "box";

  const lower = category.toLowerCase();
  if (lower.includes("travel") || lower.includes("flight") || lower.includes("cab")) {
    return "plane";
  }
  if (lower.includes("food") || lower.includes("meal") || lower.includes("dining")) {
    return "coffee";
  }
  if (lower.includes("medical") || lower.includes("health") || lower.includes("doctor")) {
    return "activity";
  }
  if (lower.includes("petrol") || lower.includes("fuel") || lower.includes("gas") || lower.includes("diesel")) {
    return "truck";
  }
  if (lower.includes("office") || lower.includes("supplies") || lower.includes("stationery")) {
    return "briefcase";
  }
  if (lower.includes("internet") || lower.includes("wifi") || lower.includes("broadband") || lower.includes("phone")) {
    return "wifi";
  }
  if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("stay") || lower.includes("lodging")) {
    return "home";
  }
  if (lower.includes("entertainment") || lower.includes("movie") || lower.includes("event")) {
    return "film";
  }

  return "box";
}

/**
 * Formats a smart expense display title instead of exposing internal EXP001 code.
 * Example: "Travel 12 Aug"
 */
export function formatSmartExpenseTitle(category?: string, expenseDate?: string): string {
  const catName = category || "Expense";
  if (!expenseDate) return catName;

  try {
    const d = new Date(expenseDate);
    if (!isNaN(d.getTime())) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = d.getDate();
      const month = monthNames[d.getMonth()];
      return `${catName} ${day} ${month}`;
    }
  } catch {
    // fallback
  }
  return `${catName} ${expenseDate}`;
}
