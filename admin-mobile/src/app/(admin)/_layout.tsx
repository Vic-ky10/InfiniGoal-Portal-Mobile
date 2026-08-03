import { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { useThemeStore } from "@/store";
import { CustomDrawerContent, DrawerRoute } from "@/components/common";

const ADMIN_ROUTES: DrawerRoute[] = [
  { name: "dashboard",     title: "Dashboard",     icon: "grid",          path: "/(admin)/dashboard" },
  { name: "employees",     title: "Employees",     icon: "users",         path: "/(admin)/employees" },
  { name: "attendance",    title: "Attendance",    icon: "clock",         path: "/(admin)/attendance" },
  { name: "leave",         title: "Leave",         icon: "calendar",      path: "/(admin)/leave" },
  { name: "expenses",      title: "Expenses",      icon: "dollar-sign",   path: "/(admin)/expenses" },
  { name: "expense-tracker", title: "Expense Tracker", icon: "trending-up", path: "/(admin)/expense-tracker" },
  { name: "sales",         title: "Sales Module",  icon: "shopping-cart", path: "/(admin)/sales" },
  { name: "projects",      title: "Projects",      icon: "folder",        path: "/(admin)/projects" },
  { name: "tasks",         title: "Tasks",         icon: "check-square",  path: "/(admin)/tasks" },
  { name: "incentives",    title: "Incentives",    icon: "award",         path: "/(admin)/incentives" },
  { name: "announcements", title: "Announcements", icon: "bell",          path: "/(admin)/announcements" },
  { name: "notifications", title: "Notifications", icon: "message-square",path: "/(admin)/notifications" },
  { name: "settings",      title: "Settings",      icon: "settings",      path: "/(admin)/settings" },
];

export default function AdminLayout() {
  const setMode = useThemeStore((state) => state.setMode);

  useEffect(() => {
    setMode("admin");
  }, []);

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 280 },
        // suppress all default item styling — CustomDrawerContent owns it
        drawerActiveTintColor: "#2563EB",
        drawerInactiveTintColor: "transparent",
        drawerActiveBackgroundColor: "transparent",
        drawerInactiveBackgroundColor: "transparent",
        overlayColor: "rgba(0,0,0,0.35)",
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          drawerProps={props}
          primaryColor="#2563EB"
          appName="Admin Portal"
          appSubtitle="InfiniGoal Management"
          appIcon="shield"
          routes={ADMIN_ROUTES}
        />
      )}
    >
      <Drawer.Screen name="dashboard"     options={{ title: "Dashboard" }} />
      <Drawer.Screen name="employees"     options={{ title: "Employees" }} />
      <Drawer.Screen name="attendance"    options={{ title: "Attendance" }} />
      <Drawer.Screen name="leave"         options={{ title: "Leave" }} />
      <Drawer.Screen name="expenses"      options={{ title: "Expenses" }} />
      <Drawer.Screen name="expense-tracker" options={{ title: "Expense Tracker" }} />
      <Drawer.Screen name="sales"         options={{ title: "Sales Module" }} />
      <Drawer.Screen name="projects"      options={{ title: "Projects" }} />
      <Drawer.Screen name="tasks"         options={{ title: "Tasks" }} />
      <Drawer.Screen name="incentives"    options={{ title: "Incentives" }} />
      <Drawer.Screen name="announcements" options={{ title: "Announcements" }} />
      <Drawer.Screen name="notifications" options={{ title: "Notifications" }} />
      <Drawer.Screen name="settings"      options={{ title: "Settings" }} />
    </Drawer>
  );
}