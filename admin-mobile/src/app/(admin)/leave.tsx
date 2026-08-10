import { useMemo, useState } from "react";
import { View, FlatList } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { spacing } from "@/theme";

import { useLeave } from "@/features/leave/hooks/useLeave";
import LeaveCard from "@/features/leave/components/LeaveCard";
import LeaveFilterBar from "@/features/leave/components/LeaveFilterBar";
import { LeaveFilters } from "@/features/leave/leave.types";

export default function LeaveScreen() {
  const [filters, setFilters] = useState<LeaveFilters>({});

  const { leaveRequests, loading, refreshing, refresh, handleReview } =
    useLeave();

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((leave) => {
      // Status
      if (filters.status && leave.status !== filters.status) return false;
      
      // Leave Type
      if (filters.leaveType && leave.leave_type !== filters.leaveType) return false;
      
      // Date
      if (filters.date) {
        const d = filters.date;
        if (leave.start_date !== d && (leave.start_date > d || leave.end_date < d)) return false;
      }

      // Month (YYYY-MM)
      if (filters.month && !leave.start_date.startsWith(filters.month)) return false;
      
      // Year (YYYY)
      if (filters.year && !leave.start_date.startsWith(filters.year)) return false;

      // Employee (profileId)
      if (filters.profileId && leave.profile_id !== filters.profileId) return false;

      // Search
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const searchMatch =
          leave.employee?.full_name.toLowerCase().includes(s) ||
          leave.employee?.employee_id.toLowerCase().includes(s) ||
          leave.employee?.email.toLowerCase().includes(s);
        if (!searchMatch) return false;
      }
      
      // Department
      if (filters.department && leave.employee?.department !== filters.department) return false;

      return true;
    });
  }, [leaveRequests, filters]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1}}>
        <AppHeader
          title="Leave Requests"
          subtitle="Review employee leave applications"
        />

      
        <LeaveFilterBar filters={filters} onFiltersChange={setFilters} leaves={leaveRequests} isAdmin />

      

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
