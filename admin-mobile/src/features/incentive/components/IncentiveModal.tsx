import { useState, useEffect } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Input } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { IncentiveWithEmployee, INCENTIVE_TYPE } from "../incentive.types";
import { createIncentive, updateIncentive, getAuthenticatedProfileId } from "../incentive.service";
import { getEmployees } from "@/features/employee/employee.service";
import { Employee } from "@/features/employee/employee.types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  incentiveToEdit?: IncentiveWithEmployee | null;
}

export default function IncentiveModal({
  visible,
  onClose,
  onSuccess,
  incentiveToEdit,
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [incentiveType, setIncentiveType] = useState<string>(INCENTIVE_TYPE.PERFORMANCE);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEmployees();
    }
  }, [visible]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await getEmployees();
      setEmployees(data);

      if (incentiveToEdit) {
        setSelectedProfileId(incentiveToEdit.profile_id);
        setIncentiveType(incentiveToEdit.incentive_type);
        setTitle(incentiveToEdit.title);
        setDescription(incentiveToEdit.description || "");
        setAmount(String(incentiveToEdit.amount));
        setMonth(String(incentiveToEdit.month));
        setYear(String(incentiveToEdit.year));
      } else if (data.length > 0) {
        setSelectedProfileId(data[0].id);
        setIncentiveType(INCENTIVE_TYPE.PERFORMANCE);
        setTitle("");
        setDescription("");
        setAmount("");
        setMonth(String(new Date().getMonth() + 1));
        setYear(String(new Date().getFullYear()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProfileId || !title.trim() || !description.trim() || !amount.trim()) {
      Alert.alert("Validation Error", "Please fill in Employee, Title, Description, and Amount.");
      return;
    }

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid positive amount.");
      return;
    }

    setSubmitting(true);
    try {
      const profileId = await getAuthenticatedProfileId();
      if (!profileId) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const payload = {
        profile_id: selectedProfileId,
        incentive_type: incentiveType as any,
        title: title.trim(),
        description: description.trim(),
        amount: numAmount,
        month: Number(month),
        year: Number(year),
      };

      let res;
      if (incentiveToEdit) {
        res = await updateIncentive(incentiveToEdit.id, payload);
      } else {
        res = await createIncentive(profileId, payload);
      }

      if (res.success) {
        Alert.alert("Success", res.message);
        onSuccess();
        onClose();
      } else {
        Alert.alert("Error", res.error || "Failed to save incentive.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: adminColors.background,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: "85%",
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <AppText variant="h2" weight="700">
              {incentiveToEdit ? "Edit Incentive" : "Award Incentive"}
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={adminColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Select Employee */}
            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Select Employee
            </AppText>
            <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
              {employees.length === 0 ? (
                <AppText variant="caption" color={adminColors.textSecondary}>
                  Loading employee directory...
                </AppText>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                  {employees.map((emp) => {
                    const isSel = selectedProfileId === emp.id;
                    return (
                      <TouchableOpacity
                        key={emp.id}
                        onPress={() => setSelectedProfileId(emp.id)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                          borderRadius: radius.md,
                          backgroundColor: isSel ? adminColors.primary : adminColors.surface,
                          borderWidth: 1,
                          borderColor: isSel ? adminColors.primary : adminColors.border,
                        }}
                      >
                        <AppText
                          variant="caption"
                          weight="600"
                          color={isSel ? "#FFFFFF" : adminColors.textSecondary}
                        >
                          {emp.full_name} ({emp.employee_id})
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Incentive Type Selector */}
            <AppText weight="600" style={{ marginBottom: spacing.xs }}>
              Incentive Type
            </AppText>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginBottom: spacing.lg,
                flexWrap: "wrap",
              }}
            >
              {[
                INCENTIVE_TYPE.PERFORMANCE,
                INCENTIVE_TYPE.CUSTOMER_CONVERSION,
                INCENTIVE_TYPE.SPECIAL_BONUS,
              ].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setIncentiveType(t)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.md,
                    backgroundColor:
                      incentiveType === t ? adminColors.primary : adminColors.surface,
                    borderWidth: 1,
                    borderColor:
                      incentiveType === t ? adminColors.primary : adminColors.border,
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="600"
                    color={incentiveType === t ? "#FFFFFF" : adminColors.textSecondary}
                  >
                    {t}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Award Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Q3 Top Performer Bonus"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Reason / performance justification"
              multiline
              numberOfLines={3}
            />
            <Input
              label="Amount (₹)"
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 5000"
              keyboardType="numeric"
            />

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Month (1-12)"
                  value={month}
                  onChangeText={setMonth}
                  placeholder="1-12"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Year"
                  value={year}
                  onChangeText={setYear}
                  placeholder="2026"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button
              title={incentiveToEdit ? "Update Incentive" : "Award Incentive"}
              onPress={handleSubmit}
              loading={submitting}
            />
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
