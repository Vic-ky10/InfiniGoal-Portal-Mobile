import { Pressable, View } from "react-native";

import { Card, AppText } from "@/components/ui";
import { Employee } from "../employee.types";


interface Props {
  employee: Employee;
  onPress: () => void;
}

export default function EmployeeCard({
  employee,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <AppText weight="700">
          {employee.full_name}
        </AppText>

        <AppText>
          {employee.employee_id}
        </AppText>

        <AppText>
          {employee.department}
        </AppText>

        <AppText>
          {employee.role}
        </AppText>
      </Card>
    </Pressable>
  );
}