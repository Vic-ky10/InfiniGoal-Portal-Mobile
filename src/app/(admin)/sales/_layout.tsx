import { Stack } from "expo-router";

export default function SalesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="purchases" />
      <Stack.Screen name="areas" />
      <Stack.Screen name="rules" />
    </Stack>
  );
}
