import { Drawer } from "expo-router/drawer";
import { Feather } from "@expo/vector-icons";

export default function EmployeeLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerActiveTintColor: "#22C55E",
        drawerActiveBackgroundColor: "#22C55E15",
        drawerInactiveTintColor: "#64748B",
        drawerStyle: {
          width: 280,
          backgroundColor: "#FFFFFF",
        },
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="attendance"
        options={{
          title: "Attendance",
          drawerIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="leave"
        options={{
          title: "Leave",
          drawerIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="expenses"
        options={{
          title: "Expenses",
          drawerIcon: ({ color, size }) => (
            <Feather name="dollar-sign" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="projects"
        options={{
          title: "My Projects",
          drawerIcon: ({ color, size }) => (
            <Feather name="folder" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="tasks"
        options={{
          title: "My Tasks",
          drawerIcon: ({ color, size }) => (
            <Feather name="check-square" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="incentives"
        options={{
          title: "Incentives",
          drawerIcon: ({ color, size }) => (
            <Feather name="award" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="announcements"
        options={{
          title: "Announcements",
          drawerIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="notifications"
        options={{
          title: "Notifications",
          drawerIcon: ({ color, size }) => (
            <Feather name="message-square" size={size} color={color as string} />
          ),
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: "My Profile",
          drawerIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color as string} />
          ),
        }}
      />
    </Drawer>
  );
}