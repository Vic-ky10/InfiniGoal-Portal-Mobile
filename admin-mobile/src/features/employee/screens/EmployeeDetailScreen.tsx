import { useLocalSearchParams } from "expo-router";

import { Screen, AppText } from "@/components/ui";

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return (
    <Screen>
      <AppText variant="h2">
        Employee Details
      </AppText>

      <AppText>ID : {id}</AppText>
    </Screen>
  );
}