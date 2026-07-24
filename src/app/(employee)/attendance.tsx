import { useState, useEffect, useCallback } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";

import { AppText, Screen, Card, Badge, Button } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { Attendance } from "@/features/attendance/attendance.types";
import {
  getTodayAttendance,
  getAttendanceHistory,
  loginAttendance,
  logoutAttendance,
} from "@/features/attendance/attendance.service";

export default function EmployeeAttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfileId(user.id);

      const [today, historyData] = await Promise.all([
        getTodayAttendance(user.id),
        getAttendanceHistory(user.id, 30),
      ]);

      setTodayRecord(today);
      setHistory(historyData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClockIn = async () => {
    if (!profileId) return;
    setActionLoading(true);
    try {
      const res = await loginAttendance(profileId);
      if (res.success) {
        Alert.alert("Success", res.message);
        loadData(true);
      } else {
        Alert.alert("Error", res.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!profileId) return;
    setActionLoading(true);
    try {
      const res = await logoutAttendance(profileId);
      if (res.success) {
        Alert.alert("Success", res.message);
        loadData(true);
      } else {
        Alert.alert("Error", res.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: Attendance }) => (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <AppText weight="700">{item.attendance_date}</AppText>
          <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: 2 }}>
            In: {item.login_time ? new Date(item.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"} | Out: {item.logout_time ? new Date(item.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
          </AppText>
        </View>
        <Badge
          label={item.status}
          color={
            item.status === "Present"
              ? employeeColors.primary
              : item.status === "Incomplete"
              ? employeeColors.warning
              : employeeColors.danger
          }
        />
      </View>
    </Card>
  );

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Attendance" subtitle="Track your daily work hours" />

        {/* Today's Clock In / Clock Out Card */}
        <Card
          style={{
            borderColor: employeeColors.border,
            borderLeftWidth: 6,
            borderLeftColor: todayRecord
              ? todayRecord.logout_time
                ? employeeColors.info
                : employeeColors.primary
              : employeeColors.warning,
            padding: spacing.xl,
            ...shadows.sm,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <AppText variant="h3" weight="700" color={employeeColors.text}>
                Today's Attendance
              </AppText>
              <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: 2 }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </AppText>
            </View>
            <Badge
              label={
                todayRecord
                  ? todayRecord.logout_time
                    ? "Completed"
                    : "Logged In"
                  : "Not Checked In"
              }
              color={
                todayRecord
                  ? todayRecord.logout_time
                    ? employeeColors.info
                    : employeeColors.primary
                  : employeeColors.warning
              }
            />
          </View>

          {/* Log times display */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: spacing.lg, backgroundColor: `${employeeColors.border}30`, padding: spacing.md, borderRadius: radius.md }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <AppText variant="caption" color={employeeColors.textSecondary}>Check In</AppText>
              <AppText weight="700" variant="title" style={{ marginTop: 4 }}>
                {todayRecord?.login_time
                  ? new Date(todayRecord.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "--:--"}
              </AppText>
            </View>
            <View style={{ width: 1, height: "100%", backgroundColor: employeeColors.border }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <AppText variant="caption" color={employeeColors.textSecondary}>Check Out</AppText>
              <AppText weight="700" variant="title" style={{ marginTop: 4 }}>
                {todayRecord?.logout_time
                  ? new Date(todayRecord.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "--:--"}
              </AppText>
            </View>
          </View>

          <View style={{ width: "100%" }}>
            {!todayRecord ? (
              <Button
                title={actionLoading ? "Checking In..." : "Check In Now"}
                loading={actionLoading}
                onPress={handleClockIn}
              />
            ) : !todayRecord.logout_time ? (
              <Button
                title={actionLoading ? "Checking Out..." : "Check Out Now"}
                loading={actionLoading}
                onPress={handleClockOut}
              />
            ) : (
              <View style={{ alignItems: "center", paddingVertical: spacing.xs }}>
                <AppText weight="600" color={employeeColors.success}>
                  Attendance complete for today!
                </AppText>
              </View>
            )}
          </View>
        </Card>

        <AppText variant="h3" weight="700" style={{ marginTop: spacing.sm }}>
          Attendance History
        </AppText>

        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No attendance history found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
