import { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Screen, Card, Badge, Input, Button } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { LeaveRequest, LEAVE_TYPE, LEAVE_DURATION } from "@/features/leave/leave.types";
import {
  getEmployeeLeaveRequests,
  createLeaveRequest,
  cancelPendingLeaveRequest,
} from "@/features/leave/leave.service";

export default function EmployeeLeaveScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Form State
  const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPE.CASUAL);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfileId(user.id);
      const data = await getEmployeeLeaveRequests(user.id);
      setLeaveRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyLeave = async () => {
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert("Validation Error", "Please select start and end dates.");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Validation Error", "Please provide a reason for leave.");
      return;
    }

    setSubmitting(true);
    try {
      if (!profileId) return;
      const res = await createLeaveRequest(profileId, {
        leave_type: leaveType as any,
        leave_duration: LEAVE_DURATION.FULL_DAY,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      if (res.success) {
        Alert.alert("Success", res.message);
        setModalVisible(false);
        setReason("");
        loadData(true);
      } else {
        Alert.alert("Error", res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = (requestId: string) => {
    Alert.alert("Cancel Leave", "Are you sure you want to cancel this pending leave request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const res = await cancelPendingLeaveRequest(profileId || "", requestId);
            if (res.success) {
              Alert.alert("Success", res.message);
              loadData(true);
            } else {
              Alert.alert("Error", res.error);
            }
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => (
    <Card style={{ marginBottom: spacing.md, borderWidth: 1, borderColor: employeeColors.border, ...shadows.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppText weight="700" variant="title" color={employeeColors.text}>
              {item.leave_type} Leave
            </AppText>
            <Badge
              label={item.status}
              color={
                item.status === "Approved"
                  ? employeeColors.primary
                  : item.status === "Pending"
                  ? employeeColors.warning
                  : employeeColors.danger
              }
            />
          </View>
          <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: spacing.xs }}>
            {item.start_date} to {item.end_date} ({item.total_days} day{item.total_days > 1 ? "s" : ""})
          </AppText>
          {item.reason && (
            <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.sm }}>
              "{item.reason}"
            </AppText>
          )}
          {item.review_comment && (
            <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: spacing.xs, fontStyle: "italic" }}>
              Manager Note: {item.review_comment}
            </AppText>
          )}
        </View>

        {item.status === "Pending" && (
          <TouchableOpacity onPress={() => handleCancelRequest(item.id)} style={{ padding: spacing.xs, backgroundColor: "#EF444410", borderRadius: radius.sm }}>
            <Feather name="x-circle" size={16} color={employeeColors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Leave Requests"
          subtitle="Apply and track your leaves"
          rightComponent={
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                backgroundColor: employeeColors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
              }}
            >
              <AppText weight="700" color="#FFFFFF">
                + Apply
              </AppText>
            </TouchableOpacity>
          }
        />

        <FlatList
          data={leaveRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaveItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Leave Requests Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />

        {/* Apply Leave Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: "85%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
                <AppText variant="h2" weight="700">
                  Apply for Leave
                </AppText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={employeeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <AppText weight="600" style={{ marginBottom: spacing.xs, fontSize: 13 }} color={employeeColors.textSecondary}>
                  Leave Type
                </AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.lg }}>
                  {[LEAVE_TYPE.CASUAL, LEAVE_TYPE.SICK, LEAVE_TYPE.WORK_FROM_HOME, LEAVE_TYPE.OTHER].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setLeaveType(type)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: leaveType === type ? employeeColors.primary : employeeColors.border,
                        backgroundColor: leaveType === type ? `${employeeColors.primary}10` : "#FFFFFF",
                      }}
                    >
                      <AppText weight={leaveType === type ? "700" : "500"} color={leaveType === type ? employeeColors.primary : employeeColors.text}>
                        {type}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Start Date (YYYY-MM-DD)"
                  value={startDate}
                  onChangeText={setStartDate}
                />

                <Input
                  label="End Date (YYYY-MM-DD)"
                  value={endDate}
                  onChangeText={setEndDate}
                />

                <Input
                  label="Reason"
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Enter reason for leave..."
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: "top" }}
                />

                <Button
                  title="Submit Leave Request"
                  loading={submitting}
                  onPress={handleApplyLeave}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
