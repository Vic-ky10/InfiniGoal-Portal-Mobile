import { FlatList } from "react-native";

import EmployeeCard from "./EmployeeCard";
import { Employee } from "../employee.types";
import { EmptyState } from "@/components/common";
import { spacing } from "@/theme";



interface Props {
  employees: Employee[];
  refreshing: boolean;
  onSelect: (employee: Employee) => void;
  onRefresh: () => void;
}

export default function EmployeeList({
  employees,
  refreshing,
  onSelect,
  onRefresh,
}: Props) {
  return (
    <FlatList
      data={employees}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{
        gap: spacing.md,
        paddingBottom: spacing.lg,
        flexGrow: employees.length === 0 ? 1 : undefined,
      }}
      ListEmptyComponent={<EmptyState title="No employees found." />}
      renderItem={({ item }) => (
        <EmployeeCard
          employee={item}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}
