import { useMemo, useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";

import { AppText, Screen, Card } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useAttendance } from "@/features/attendance/hooks/useAttendance";
import AttendanceCard from "@/features/attendance/components/AttendanceCard";
import { AttendanceStatus } from "@/features/attendance/attendance.types";

const STATUS_OPTIONS: { label: string; value: AttendanceStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Present", value: "Present" },
  { label: "Incomplete", value: "Incomplete" },
  { label: "Absent", value: "Absent" },
];

export default function AttendanceScreen() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "">("");
  const { records, summary, loading, refreshing, refresh } = useAttendance();

  const filteredRecords = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return records.filter((record) => {
      const employee = record.employee;

      const matchesSearch =
        search === "" ||
        employee?.full_name?.toLowerCase().includes(search) ||
        employee?.employee_id?.toLowerCase().includes(search) ||
        employee?.email?.toLowerCase().includes(search) ||
        employee?.department?.toLowerCase().includes(search) ||
        employee?.designation?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchText, statusFilter]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Attendance" subtitle="Daily employee check-in logs" />

        {/* Summary Metrics */}
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Present
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.success}>
              {summary.present}
            </AppText>
          </Card>

          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Incomplete
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.warning}>
              {summary.incomplete}
            </AppText>
          </Card>

          <Card style={{ flex: 1, padding: spacing.sm, alignItems: "center" }}>
            <AppText variant="caption" color={adminColors.textSecondary}>
              Absent
            </AppText>
            <AppText weight="700" variant="h3" color={adminColors.danger}>
              {summary.absent}
            </AppText>
          </Card>
        </View>

        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search employee..."
        />

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setStatusFilter(opt.value)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected
                    ? adminColors.primary
                    : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? adminColors.primary
                    : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List of Records */}
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredRecords.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No attendance logs found." />}
          renderItem={({ item }) => <AttendanceCard record={item} />}
        />
      </View>
    </Screen>
  );
}
