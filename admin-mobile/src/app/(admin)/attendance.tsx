import { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable } from "react-native";

import { AppText, Screen, Card } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, spacing } from "@/theme";

import { useAttendance } from "@/features/attendance/hooks/useAttendance";
import AttendanceCard from "@/features/attendance/components/AttendanceCard";
import AttendanceFilterBar from "@/features/attendance/components/AttendanceFilterBar";

export default function AttendanceScreen() {
  const [selectedSummary, setSelectedSummary] = useState<
    "present" | "incomplete" | "absent"
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
    filters,
    setFilters,
    refresh,
  } = useAttendance();

  // "Present" tab merges full-day present + short hours + half day so that
  // every employee who logged in today appears in that section.
  const allPresentRecords = useMemo(
    () => [...presentRecords, ...shortHoursRecords, ...halfDayRecords],
    [presentRecords, shortHoursRecords, halfDayRecords],
  );

  // Combined present count for the summary card.
  const presentCount = summary.present + summary.shortHours + summary.halfDay;

  useEffect(() => {
    switch (selectedSummary) {
      case "present":
        setRecords(allPresentRecords);
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
    allPresentRecords,
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
                {presentCount}
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

        <AttendanceFilterBar filters={filters} onFiltersChange={setFilters} isAdmin />

        {/* List of Records */}
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: records.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No attendance logs found." />}
          renderItem={({ item }) => <AttendanceCard record={item} />}
        />
      </View>
    </Screen>
  );
}
