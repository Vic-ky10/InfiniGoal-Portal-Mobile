import { FlatList } from "react-native";

import EmployeeCard from "./EmployeeCard";
import { Employee } from "../employee.types";



interface Props {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
}

export default function EmployeeList({
  employees,
  onSelect,
}: Props) {
  return (
    <FlatList
      data={employees}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EmployeeCard
          employee={item}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}