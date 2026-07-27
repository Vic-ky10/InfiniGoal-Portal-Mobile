import { useMemo, useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";

import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useLeave } from "@/features/leave/hooks/useLeave";
import LeaveCard from "@/features/leave/components/LeaveCard";
import { LeaveStatus } from "@/features/leave/leave.types";

const STATUS_FILTERS: { label: string; value: LeaveStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

export default function LeaveScreen() {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("");

  const { leaveRequests, loading, refreshing, refresh, handleReview } =
    useLeave();

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((leave) => {
      return statusFilter === "" || leave.status === statusFilter;
    });
  }, [leaveRequests, statusFilter]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Leave Requests"
          subtitle="Review employee leave applications"
        />

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {STATUS_FILTERS.map((opt) => {
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

        {/* leave requests list data */}

        <FlatList
          data={filteredLeaveRequests}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredLeaveRequests.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No leave requests found." />}
          renderItem={({ item }) => (
            <LeaveCard leave={item} onReview={handleReview} />
          )}
        />
      </View>
    </Screen>
  );
}
