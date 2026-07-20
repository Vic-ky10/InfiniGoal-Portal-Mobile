import { Drawer } from "expo-router/drawer";

export default function AdminLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerActiveTintColor: "#2563EB",
        drawerInactiveTintColor: "#64748B",
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
        },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
        }}
      />

      <Drawer.Screen
        name="employees"
        options={{
          title: "Employees",
        }}
      />

      <Drawer.Screen
        name="attendance"
        options={{
          title: "Attendance",
        }}
      />

      <Drawer.Screen
        name="leave"
        options={{
          title: "Leave",
        }}
      />

      <Drawer.Screen
        name="expenses"
        options={{
          title: "Expenses",
        }}
      />

      <Drawer.Screen
        name="projects"
        options={{
          title: "Projects",
        }}
      />

      <Drawer.Screen
        name="tasks"
        options={{
          title: "Tasks",
        }}
      />

      <Drawer.Screen
        name="announcements"
        options={{
          title: "Announcements",
        }}
      />

      <Drawer.Screen
        name="notifications"
        options={{
          title: "Notifications",
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Drawer>
  );
}