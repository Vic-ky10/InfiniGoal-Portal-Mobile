import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import {
  AppText,
  Screen,
  Input,
  Button,
  DatePickerField,
} from "@/components/ui";
import {
  AppHeader,
  EmptyState,
  ActionSheet,
  ActionSheetOption,
} from "@/components/common";
import { employeeColors, radius, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/store/toast.store";

import {
  LeaveRequest,
  LEAVE_TYPE,
  LEAVE_DURATION,
  LeaveFilters,
} from "@/features/leave/leave.types";
import {
  getEmployeeLeaveRequests,
  createLeaveRequest,
  cancelPendingLeaveRequest,
} from "@/features/leave/leave.service";
import LeaveCard from "@/features/leave/components/LeaveCard";
import LeaveFilterBar from "@/features/leave/components/LeaveFilterBar";

export default function EmployeeLeaveScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filters, setFilters] = useState<LeaveFilters>({});

  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean;
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    options: [],
  });

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((leave) => {
      if (filters.status && leave.status !== filters.status) return false;
      if (filters.leaveType && leave.leave_type !== filters.leaveType)
        return false;
      if (filters.date) {
        const d = filters.date;
        if (
          leave.start_date !== d &&
          (leave.start_date > d || leave.end_date < d)
        )
          return false;
      }
      if (filters.month && !leave.start_date.startsWith(filters.month))
        return false;
      if (filters.year && !leave.start_date.startsWith(filters.year))
        return false;
      return true;
    });
  }, [leaveRequests, filters]);

  const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPE.CASUAL);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    Promise.resolve().then(() => {
      loadData();
    });

    if (!profileId) return;

    const channel = supabase
      .channel("employee-leave-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        (payload: {
          new: Record<string, unknown> | null;
          old: Record<string, unknown> | null;
        }) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          const affectedProfileId = (newRow?.profile_id ||
            oldRow?.profile_id) as string | undefined;

          if (affectedProfileId === profileId) {
            loadData(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, profileId]);

  const handleApplyLeave = async () => {
    if (!startDate.trim() || !endDate.trim()) {
      toast.error("Please select start and end dates.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for leave.");
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
        toast.success(res.message || "Leave request submitted successfully.");
        setModalVisible(false);
        setReason("");
        loadData(true);
      } else {
        toast.error(res.error || "Failed to submit leave request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setActionSheetConfig({
      visible: true,
      title: "Cancel Leave",
      subtitle: "Are you sure you want to cancel this pending leave request?",
      options: [
        {
          label: "Yes, Cancel Leave",
          isDestructive: true,
          icon: "❌",
          onPress: async () => {
            try {
              const res = await cancelPendingLeaveRequest(
                profileId || "",
                requestId,
              );
              if (res.success) {
                toast.success(
                  res.message || "Leave request cancelled successfully.",
                );
                loadData(true);
              } else {
                toast.error(res.error || "Failed to cancel leave request.");
              }
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    });
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => (
    <LeaveCard
      leave={item as any}
      showAvatar={false}
      showActions={false}
      onCancel={
        item.status === "Pending"
          ? () => handleCancelRequest(item.id)
          : undefined
      }
    />
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

        <LeaveFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          isAdmin={false}
        />

        <FlatList
          data={filteredLeaveRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaveItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Leave Requests Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />

        {/* apply Leave Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: "transparent",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                padding: spacing.xl,
                maxHeight: "85%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.lg,
                }}
              >
                <AppText variant="h2" weight="700">
                  Apply for Leave
                </AppText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={employeeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.formScroll}
                contentContainerStyle={[
                  styles.form,
                  { flexGrow: 1, paddingBottom: spacing.xxxl },
                ]}
              >
                <AppText
                  weight="600"
                  style={{ marginBottom: spacing.xs, fontSize: 13 }}
                  color={employeeColors.textSecondary}
                >
                  Leave Type
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.xs,
                    marginBottom: spacing.lg,
                  }}
                >
                  {[
                    LEAVE_TYPE.CASUAL,
                    LEAVE_TYPE.SICK,
                    LEAVE_TYPE.WORK_FROM_HOME,
                    LEAVE_TYPE.OTHER,
                  ].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setLeaveType(type)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor:
                          leaveType === type
                            ? employeeColors.primary
                            : employeeColors.border,
                        backgroundColor:
                          leaveType === type
                            ? `${employeeColors.primary}10`
                            : "#FFFFFF",
                      }}
                    >
                      <AppText
                        weight={leaveType === type ? "700" : "500"}
                        color={
                          leaveType === type
                            ? employeeColors.primary
                            : employeeColors.text
                        }
                      >
                        {type}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>

                <DatePickerField
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="YYYY-MM-DD"
                />

                <DatePickerField
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="YYYY-MM-DD"
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

      <ActionSheet
        visible={actionSheetConfig.visible}
        onClose={() =>
          setActionSheetConfig((prev) => ({ ...prev, visible: false }))
        }
        title={actionSheetConfig.title}
        subtitle={actionSheetConfig.subtitle}
        options={actionSheetConfig.options}
        cancelText="No, Keep It"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    flexShrink: 1,
  },
  form: {
    gap: spacing.sm,
  },
});
