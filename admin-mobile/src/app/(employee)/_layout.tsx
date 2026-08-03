import { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { useThemeStore } from "@/store";
import { CustomDrawerContent, DrawerRoute } from "@/components/common";

const EMPLOYEE_ROUTES: DrawerRoute[] = [
  { name: "dashboard",     title: "Dashboard",     icon: "grid",          path: "/(employee)/dashboard" },
  { name: "attendance",    title: "Attendance",    icon: "clock",         path: "/(employee)/attendance" },
  { name: "leave",         title: "Leave",         icon: "calendar",      path: "/(employee)/leave" },
  { name: "expenses",      title: "My Expenses",   icon: "dollar-sign",   path: "/(employee)/expenses" },
  { name: "expense-tracker", title: "Expense Tracker", icon: "trending-up", path: "/(employee)/expense-tracker" },
  { name: "sales",         title: "My Sales",      icon: "shopping-cart", path: "/(employee)/sales" },
  { name: "projects",      title: "My Projects",   icon: "folder",        path: "/(employee)/projects" },
  { name: "tasks",         title: "My Tasks",      icon: "check-square",  path: "/(employee)/tasks" },
  { name: "incentives",    title: "Incentives",    icon: "award",         path: "/(employee)/incentives" },
  { name: "announcements", title: "Announcements", icon: "bell",          path: "/(employee)/announcements" },
  { name: "notifications", title: "Notifications", icon: "message-square",path: "/(employee)/notifications" },
  { name: "profile",       title: "My Profile",    icon: "user",          path: "/(employee)/profile" },
];

export default function EmployeeLayout() {
  const setMode = useThemeStore((state) => state.setMode);

  useEffect(() => {
    setMode("employee");
  }, [setMode]);

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 280 },
        // suppress all default item styling — CustomDrawerContent owns it
        drawerActiveTintColor: "#22C55E",
        drawerInactiveTintColor: "transparent",
        drawerActiveBackgroundColor: "transparent",
        drawerInactiveBackgroundColor: "transparent",
        overlayColor: "rgba(0,0,0,0.35)",
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          drawerProps={props}
          primaryColor="#22C55E"
          appName="Employee Portal"
          appSubtitle="InfiniGoal Workspace"
          appIcon="briefcase"
          routes={EMPLOYEE_ROUTES}
        />
      )}
    >
      <Drawer.Screen name="dashboard"     options={{ title: "Dashboard" }} />
      <Drawer.Screen name="attendance"    options={{ title: "Attendance" }} />
      <Drawer.Screen name="leave"         options={{ title: "Leave" }} />
      <Drawer.Screen name="expenses"      options={{ title: "My Expenses" }} />
      <Drawer.Screen name="expense-tracker" options={{ title: "Expense Tracker" }} />
      <Drawer.Screen name="sales"         options={{ title: "My Sales" }} />
      <Drawer.Screen name="projects"      options={{ title: "My Projects" }} />
      <Drawer.Screen name="tasks"         options={{ title: "My Tasks" }} />
      <Drawer.Screen name="incentives"    options={{ title: "Incentives" }} />
      <Drawer.Screen name="announcements" options={{ title: "Announcements" }} />
      <Drawer.Screen name="notifications" options={{ title: "Notifications" }} />
      <Drawer.Screen name="profile"       options={{ title: "My Profile" }} />
    </Drawer>
  );
}