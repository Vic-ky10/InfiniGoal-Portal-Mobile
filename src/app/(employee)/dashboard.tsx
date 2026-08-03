import { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, NotificationBell } from "@/components/common";
import { employeeColors, radius, spacing, shadows } from "@/theme";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile Details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, designation, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) setEmployeeName(profile.full_name);
        if (profile.designation) setDesignation(profile.designation);

        setAvatarUrl(profile.avatar_url ?? null);
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
      setPendingExpenseCount(
        expenses.filter((e) => e.status === "Pending").length,
      );
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
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  return (
    <Screen isLoading={loading} scroll={false}>
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
          <AppHeader
            title="Dashboard"
            subtitle="Welcome to your Portal"
            rightComponent={
              <NotificationBell
                count={notificationCount}
                route="/(employee)/notifications"
                surfaceColor={employeeColors.surface}
                iconColor={employeeColors.text}
                badgeColor={employeeColors.danger}
              />
            }
          />

          {/* Welcome Banner */}
          <Card
            style={{
              padding: spacing.xl,
              borderRadius: radius.lg,
              borderLeftWidth: 6,
              borderLeftColor: employeeColors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              ...shadows.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="h2" weight="700" color={employeeColors.text}>
                Hello, {employeeName}!
              </AppText>
              <AppText
                variant="body"
                color={employeeColors.textSecondary}
                style={{ marginTop: spacing.xs }}
              >
                {designation}
              </AppText>
            </View>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 50,
                overflow: "hidden",
                backgroundColor: `${employeeColors.primary}15`,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 58,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={28} color={employeeColors.primary} />
              )}
            </View>
          </Card>

          {/* Quick Action Grid */}
          <AppText
            variant="h3"
            weight="700"
            color={employeeColors.text}
            style={{ marginTop: spacing.xs }}
          >
            Overview & Quick Actions
          </AppText>

          {/* Attendance Card */}
          <TouchableOpacity
            activeOpacity={1} 
            onPress={() => router.push("/(employee)/attendance")}
          >
            <Card
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.lg,
                borderWidth: 1,
                borderColor: employeeColors.border,
                ...shadows.sm,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: `${employeeColors.primary}15`,
                    borderRadius: radius.md,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Feather
                    name="clock"
                    size={22}
                    color={employeeColors.primary}
                  />
                </View>
                <View>
                  <AppText weight="700" variant="title">
                    Attendance
                  </AppText>
                  <AppText
                    variant="caption"
                    color={employeeColors.textSecondary}
                    style={{ marginTop: 2 }}
                  >
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
            activeOpacity={1}
            onPress={() => router.push("/(employee)/leave")}
          >
            <Card
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.lg,
                borderWidth: 1,
                borderColor: employeeColors.border,
                ...shadows.sm,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: "#F59E0B15",
                    borderRadius: radius.md,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="calendar" size={22} color="#F59E0B" />
                </View>
                <View>
                  <AppText weight="700" variant="title">
                    Leave Requests
                  </AppText>
                  <AppText
                    variant="caption"
                    color={employeeColors.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    {pendingLeaveCount} pending review
                  </AppText>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={employeeColors.textSecondary}
              />
            </Card>
          </TouchableOpacity>

          {/* Expenses */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => router.push("/(employee)/expenses")}
          >
            <Card
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.lg,
                borderWidth: 1,
                borderColor: employeeColors.border,
                ...shadows.sm,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: "#3B82F615",
                    borderRadius: radius.md,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="dollar-sign" size={22} color="#3B82F6" />
                </View>
                <View>
                  <AppText weight="700" variant="title">
                    Expenses
                  </AppText>
                  <AppText
                    variant="caption"
                    color={employeeColors.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    {pendingExpenseCount} pending claims
                  </AppText>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={employeeColors.textSecondary}
              />
            </Card>
          </TouchableOpacity>

          {/* Tasks & Projects Grid */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => router.push("/(employee)/tasks")}
              style={{ flex: 1 }}
            >
              <Card
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.xl,
                  borderWidth: 1,
                  borderColor: employeeColors.border,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${employeeColors.primary}10`,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                  }}
                >
                  <Feather
                    name="check-square"
                    size={22}
                    color={employeeColors.primary}
                  />
                </View>
                <AppText variant="h2" weight="700">
                  {activeTaskCount}
                </AppText>
                <AppText
                  variant="caption"
                  color={employeeColors.textSecondary}
                  style={{ marginTop: 2 }}
                >
                  Active Tasks
                </AppText>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => router.push("/(employee)/projects")}
              style={{ flex: 1 }}
            >
              <Card
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.xl,
                  borderWidth: 1,
                  borderColor: employeeColors.border,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#8B5CF610",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                  }}
                >
                  <Feather name="folder" size={22} color="#8B5CF6" />
                </View>
                <AppText variant="h2" weight="700">
                  {projectCount}
                </AppText>
                <AppText
                  variant="caption"
                  color={employeeColors.textSecondary}
                  style={{ marginTop: 2 }}
                >
                  My Projects
                </AppText>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Incentives */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => router.push("/(employee)/incentives")}
          >
            <Card
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.lg,
                borderWidth: 1,
                borderColor: employeeColors.border,
                ...shadows.sm,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: "#EC489915",
                    borderRadius: radius.md,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Feather name="award" size={22} color="#EC4899" />
                </View>
                <View>
                  <AppText weight="700" variant="title">
                    Incentives
                  </AppText>
                  <AppText
                    variant="caption"
                    color={employeeColors.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    {incentiveCount} rewards
                  </AppText>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={employeeColors.textSecondary}
              />
            </Card>
          </TouchableOpacity>

          {/* Announcements & Notifications Row */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => router.push("/(employee)/announcements")}
              style={{ flex: 1 }}
            >
              <Card
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.xl,
                  borderWidth: 1,
                  borderColor: employeeColors.border,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#06B6D410",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                  }}
                >
                  <Feather name="bell" size={22} color="#06B6D4" />
                </View>
                <AppText variant="h2" weight="700">
                  {announcementCount}
                </AppText>
                <AppText
                  variant="caption"
                  color={employeeColors.textSecondary}
                  style={{ marginTop: 2 }}
                >
                  Announcements
                </AppText>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => router.push("/(employee)/notifications")}
              style={{ flex: 1 }}
            >
              <Card
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.xl,
                  borderWidth: 1,
                  borderColor: employeeColors.border,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#F59E0B10",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                  }}
                >
                  <Feather name="message-square" size={22} color="#F59E0B" />
                </View>
                <AppText variant="h2" weight="700">
                  {notificationCount}
                </AppText>
                <AppText
                  variant="caption"
                  color={employeeColors.textSecondary}
                  style={{ marginTop: 2 }}
                >
                  Unread Alerts
                </AppText>
              </Card>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
