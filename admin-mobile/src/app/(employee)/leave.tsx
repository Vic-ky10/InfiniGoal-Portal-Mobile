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

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
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
    if (!profileId) return;
    if (!reason.trim()) {
      Alert.alert("Validation Error", "Please state the reason for leave.");
      return;
    }

    setSubmitting(true);
    try {
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

  const handleCancelRequest = async (id: string) => {
    if (!profileId) return;
    Alert.alert("Cancel Request", "Are you sure you want to cancel this leave request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const res = await cancelPendingLeaveRequest(profileId, id);
          if (res.success) {
            Alert.alert("Cancelled", res.message);
            loadData(true);
          } else {
            Alert.alert("Error", res.error);
          }
        },
      },
    ]);
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppText weight="700" variant="h3">
              {item.leave_type}
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
          <TouchableOpacity onPress={() => handleCancelRequest(item.id)} style={{ padding: spacing.xs }}>
            <Feather name="x-circle" size={20} color={employeeColors.danger} />
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
                + Apply Leave
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
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
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
                <AppText weight="600" style={{ marginBottom: spacing.xs }}>
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
                        borderWidth: 1,
                        borderColor: leaveType === type ? employeeColors.primary : employeeColors.border,
                        backgroundColor: leaveType === type ? `${employeeColors.primary}15` : "#FFFFFF",
                      }}
                    >
                      <AppText weight={leaveType === type ? "700" : "500"} color={leaveType === type ? employeeColors.primary : employeeColors.text}>
                        {type}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>

                <AppText weight="600" style={{ marginBottom: spacing.xs }}>
                  Start Date (YYYY-MM-DD)
                </AppText>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  style={{ borderWidth: 1, borderColor: employeeColors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}
                />

                <AppText weight="600" style={{ marginBottom: spacing.xs }}>
                  End Date (YYYY-MM-DD)
                </AppText>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  style={{ borderWidth: 1, borderColor: employeeColors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}
                />

                <AppText weight="600" style={{ marginBottom: spacing.xs }}>
                  Reason
                </AppText>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Enter reason for leave..."
                  multiline
                  numberOfLines={3}
                  style={{ borderWidth: 1, borderColor: employeeColors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl, textAlignVertical: "top" }}
                />

                <TouchableOpacity
                  onPress={handleApplyLeave}
                  disabled={submitting}
                  style={{
                    backgroundColor: employeeColors.primary,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    alignItems: "center",
                    marginBottom: spacing.lg,
                  }}
                >
                  <AppText weight="700" color="#FFFFFF">
                    {submitting ? "Submitting..." : "Submit Leave Request"}
                  </AppText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
