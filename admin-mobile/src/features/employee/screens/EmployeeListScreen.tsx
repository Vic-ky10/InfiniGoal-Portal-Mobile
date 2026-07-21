import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { View, ScrollView, TouchableOpacity } from "react-native";

import { AppText, Badge, Screen } from "@/components/ui";
import { AppHeader, SearchBar } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";
import { EmployeeList } from "../components";
import { useEmployees } from "../hooks/useEmployees";

const STATUS_FILTERS = ["All", "Active", "Inactive"];

export default function EmployeeListScreen() {
  const router = useRouter();
  const { employees, loading, refreshing, refresh } = useEmployees();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" || emp.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, selectedStatus]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Employees" subtitle={`${employees.length} total staff members`} />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filter Tabs */}
        <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs }}>
          {STATUS_FILTERS.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? adminColors.primary : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? adminColors.primary : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {status}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <EmployeeList
          employees={filteredEmployees}
          refreshing={refreshing}
          onRefresh={refresh}
          onSelect={(employee) =>
            router.push({
              pathname: "/(admin)/employees/[id]",
              params: { id: employee.id },
            })
          }
        />
      </View>
    </Screen>
  );
}
