import { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable } from "react-native";

import { AppText, Screen, Card } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, spacing } from "@/theme";

import { useAttendance } from "@/features/attendance/hooks/useAttendance";
import AttendanceCard from "@/features/attendance/components/AttendanceCard";

export default function AttendanceScreen() {
  const [searchText, setSearchText] = useState("");
  const [selectedSummary, setSelectedSummary] = useState<
    "present" | "shortHours" | "halfDay" | "incomplete" | "absent"
  >("present");
  const {
    records,
    setRecords,
    presentRecords,
    shortHoursRecords,
    halfDayRecords,
    incompleteRecords,
    absentRecords,
    summary,
    loading,
    refreshing,
    refresh,
  } = useAttendance();

  const filteredRecords = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return records.filter((record) => {
      const employee = record.employee;

      return (
        search === "" ||
        employee?.full_name?.toLowerCase().includes(search) ||
        employee?.employee_id?.toLowerCase().includes(search) ||
        employee?.email?.toLowerCase().includes(search) ||
        employee?.department?.toLowerCase().includes(search) ||
        employee?.designation?.toLowerCase().includes(search)
      );
    });
  }, [records, searchText]);

  useEffect(() => {
    switch (selectedSummary) {
      case "present":
        setRecords(presentRecords);
        break;

      case "shortHours":
        setRecords(shortHoursRecords);
        break;

      case "halfDay":
        setRecords(halfDayRecords);
        break;

      case "incomplete":
        setRecords(incompleteRecords);
        break;

      case "absent":
        setRecords(absentRecords);
        break;
    }
  }, [
    selectedSummary,
    presentRecords,
    shortHoursRecords,
    halfDayRecords,
    incompleteRecords,
    absentRecords,
    setRecords,
  ]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Attendance" subtitle="Daily employee check-in logs" />

        {/* summary  */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.xs,
          }}
        >
          <Pressable
            onPress={() => setSelectedSummary("present")}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                padding: spacing.sm,
                alignItems: "center",
                borderWidth: selectedSummary === "present" ? 2 : 1,
                borderColor:
                  selectedSummary === "present"
                    ? adminColors.primary
                    : adminColors.border,
              }}
            >
              <AppText variant="caption" color={adminColors.textSecondary}>
                Present
              </AppText>
              <AppText weight="700" variant="h3" color={adminColors.success}>
                {summary.present}
              </AppText>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => setSelectedSummary("incomplete")}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                padding: spacing.sm,
                alignItems: "center",
                borderWidth: selectedSummary === "incomplete" ? 2 : 1,
                borderColor:
                  selectedSummary === "incomplete"
                    ? adminColors.primary
                    : adminColors.border,
              }}
            >
              <AppText variant="caption" color={adminColors.textSecondary}>
                Incomplete
              </AppText>
              <AppText weight="700" variant="h3" color={adminColors.warning}>
                {summary.incomplete}
              </AppText>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => setSelectedSummary("absent")}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                padding: spacing.sm,
                alignItems: "center",
                borderWidth: selectedSummary === "absent" ? 2 : 1,
                borderColor:
                  selectedSummary === "absent"
                    ? adminColors.primary
                    : adminColors.border,
              }}
            >
              <AppText variant="caption" color={adminColors.textSecondary}>
                Absent
              </AppText>
              <AppText weight="700" variant="h3" color={adminColors.danger}>
                {summary.absent}
              </AppText>
            </Card>
          </Pressable>
        </View>

        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search employee..."
        />

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
