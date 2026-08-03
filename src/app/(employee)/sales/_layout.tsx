import { Stack } from "expo-router";

export default function EmployeeSalesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="purchases" />
    </Stack>
  );
}
