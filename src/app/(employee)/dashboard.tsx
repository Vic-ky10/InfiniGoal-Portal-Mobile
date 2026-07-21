import { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { getTodayAttendance } from "@/features/attendance/attendance.service";
import { getEmployeeLeaveRequests } from "@/features/leave/leave.service";
import { getEmployeeExpenses } from "@/features/expense/expense.service";
import { getEmployeeProjects } from "@/features/project/project.service";
import { getEmployeeTasks } from "@/features/task/task.service";
import { getEmployeeIncentives } from "@/features/incentive/incentive.service";
import { getAnnouncements } from "@/features/announcement/announcement.service";
import { getNotifications } from "@/features/notification/notification.service";

export default function EmployeeDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeName, setEmployeeName] = useState("Employee");
  const [designation, setDesignation] = useState("Team Member");

  // Dashboard Stats
  const [todayStatus, setTodayStatus] = useState<string>("Not Logged In");
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingExpenseCount, setPendingExpenseCount] = useState(0);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [incentiveCount, setIncentiveCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile Details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, designation")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) setEmployeeName(profile.full_name);
        if (profile.designation) setDesignation(profile.designation);
      }

      // Parallel Data Fetching for Dashboard Summary
      const [
        attendance,
        leaves,
        expenses,
        projects,
        tasks,
        incentives,
        announcements,
        notifications,
      ] = await Promise.all([
        getTodayAttendance(user.id),
        getEmployeeLeaveRequests(user.id),
        getEmployeeExpenses(user.id),
        getEmployeeProjects(user.id),
        getEmployeeTasks(user.id),
        getEmployeeIncentives(user.id),
        getAnnouncements(),
        getNotifications(user.id),
      ]);

      // Attendance status calculation
      if (attendance) {
        setTodayStatus(attendance.logout_time ? "Completed" : "Logged In");
      } else {
        setTodayStatus("Not Logged In");
      }

      setPendingLeaveCount(leaves.filter((l) => l.status === "Pending").length);
      setPendingExpenseCount(expenses.filter((e) => e.status === "Pending").length);
      setActiveTaskCount(tasks.filter((t) => t.status !== "Completed").length);
      setProjectCount(projects.length);
      setIncentiveCount(incentives.length);
      setAnnouncementCount(announcements.length);
      setNotificationCount(notifications.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Screen
      isLoading={loading}
      scroll={false}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[employeeColors.primary]}
            tintColor={employeeColors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      >
        <View style={{ gap: spacing.lg }}>
          <AppHeader title="Dashboard" subtitle="Welcome to your Portal" />

          {/* Welcome Banner */}
          <Card
            style={{
              backgroundColor: employeeColors.primary,
              padding: spacing.xl,
              borderRadius: radius.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <AppText variant="h2" weight="700" color="#FFFFFF">
                  Hello, {employeeName}!
                </AppText>
                <AppText variant="body" color="#D1FAE5" style={{ marginTop: spacing.xs }}>
                  {designation}
                </AppText>
              </View>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Feather name="user" size={26} color="#FFFFFF" />
              </View>
            </View>
          </Card>

          {/* Quick Action Grid */}
          <AppText variant="h3" weight="700" color={employeeColors.text}>
            Overview & Quick Actions
          </AppText>

          {/* Attendance Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(employee)/attendance")}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    padding: spacing.md,
                    backgroundColor: `${employeeColors.primary}15`,
                    borderRadius: radius.md,
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="clock" size={22} color={employeeColors.primary} />
                </View>
                <View>
                  <AppText weight="700">Attendance</AppText>
                  <AppText variant="caption" color={employeeColors.textSecondary}>
                    Today: {todayStatus}
                  </AppText>
                </View>
              </View>
              <Badge
                label={todayStatus}
                color={
                  todayStatus === "Logged In"
                    ? employeeColors.primary
                    : todayStatus === "Completed"
                    ? employeeColors.info
                    : employeeColors.warning
                }
              />
            </Card>
          </TouchableOpacity>

          {/* Leave Summary */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(employee)/leave")}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    padding: spacing.md,
                    backgroundColor: "#F59E0B15",
                    borderRadius: radius.md,
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="calendar" size={22} color="#F59E0B" />
                </View>
                <View>
                  <AppText weight="700">Leave Requests</AppText>
                  <AppText variant="caption" color={employeeColors.textSecondary}>
                    {pendingLeaveCount} pending review
                  </AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={employeeColors.textSecondary} />
            </Card>
          </TouchableOpacity>

          {/* Expenses */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(employee)/expenses")}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    padding: spacing.md,
                    backgroundColor: "#3B82F615",
                    borderRadius: radius.md,
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="dollar-sign" size={22} color="#3B82F6" />
                </View>
                <View>
                  <AppText weight="700">Expenses</AppText>
                  <AppText variant="caption" color={employeeColors.textSecondary}>
                    {pendingExpenseCount} pending claims
                  </AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={employeeColors.textSecondary} />
            </Card>
          </TouchableOpacity>

          {/* Tasks & Projects Grid */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(employee)/tasks")}
              style={{ flex: 1 }}
            >
              <Card style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                <Feather name="check-square" size={26} color={employeeColors.primary} style={{ marginBottom: spacing.xs }} />
                <AppText variant="h2" weight="700">
                  {activeTaskCount}
                </AppText>
                <AppText variant="caption" color={employeeColors.textSecondary}>
                  Active Tasks
                </AppText>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(employee)/projects")}
              style={{ flex: 1 }}
            >
              <Card style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                <Feather name="folder" size={26} color="#8B5CF6" style={{ marginBottom: spacing.xs }} />
                <AppText variant="h2" weight="700">
                  {projectCount}
                </AppText>
                <AppText variant="caption" color={employeeColors.textSecondary}>
                  My Projects
                </AppText>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Incentives */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(employee)/incentives")}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    padding: spacing.md,
                    backgroundColor: "#EC489915",
                    borderRadius: radius.md,
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="award" size={22} color="#EC4899" />
                </View>
                <View>
                  <AppText weight="700">Incentives</AppText>
                  <AppText variant="caption" color={employeeColors.textSecondary}>
                    {incentiveCount} recorded rewards
                  </AppText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={employeeColors.textSecondary} />
            </Card>
          </TouchableOpacity>

          {/* Announcements & Notifications Row */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(employee)/announcements")}
              style={{ flex: 1 }}
            >
              <Card style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                <Feather name="bell" size={24} color="#06B6D4" style={{ marginBottom: spacing.xs }} />
                <AppText weight="700">{announcementCount}</AppText>
                <AppText variant="caption" color={employeeColors.textSecondary}>
                  Announcements
                </AppText>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(employee)/notifications")}
              style={{ flex: 1 }}
            >
              <Card style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                <Feather name="message-square" size={24} color="#F59E0B" style={{ marginBottom: spacing.xs }} />
                <AppText weight="700">{notificationCount} Unread</AppText>
                <AppText variant="caption" color={employeeColors.textSecondary}>
                  Notifications
                </AppText>
              </Card>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}