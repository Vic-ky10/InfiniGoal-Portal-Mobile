import React, { useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Badge, Button, Input, Avatar } from "@/components/ui";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { ExpenseWithEmployee, ExpenseStatus } from "../expense.types";
import { getCategoryIconName, formatSmartExpenseTitle } from "../utils/expenseCategoryIcon";
import ReceiptViewerModal from "./ReceiptViewerModal";

interface Props {
  visible: boolean;
  expense: ExpenseWithEmployee | null;
  onClose: () => void;
  isAdmin?: boolean;
  onReview?: (id: string, status: ExpenseStatus, approvedAmount: number, reviewComment?: string) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ExpenseDetailsModal({
  visible,
  expense,
  onClose,
  isAdmin = false,
  onReview,
  onMarkPaid,
}: Props) {
  const colors = useThemeColors();
  const [reviewComment, setReviewComment] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  if (!visible || !expense) return null;

  const iconName = getCategoryIconName(expense.expense_type);
  const smartTitle = formatSmartExpenseTitle(expense.expense_type, expense.expense_date);
  const employeeName = expense.employee?.full_name || "Employee";

  const isPdf =
    expense.receipt_type?.includes("pdf") ||
    expense.receipt_url?.toLowerCase().endsWith(".pdf") ||
    expense.receipt_name?.toLowerCase().endsWith(".pdf");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return colors.success;
      case "Rejected":
        return colors.danger;
      case "Pending":
        return colors.warning;
      default:
        return colors.disabled;
    }
  };

  const handleApprove = async () => {
    if (!onReview) return;
    const finalAmount = approvedAmount ? parseFloat(approvedAmount) : expense.amount;
    setActionLoading(true);
    try {
      const res = await onReview(expense.id, "Approved", finalAmount, reviewComment);
      if (res.success) {
        onClose();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReview) return;
    setActionLoading(true);
    try {
      const res = await onReview(expense.id, "Rejected", 0, reviewComment);
      if (res.success) {
        onClose();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return;
    setActionLoading(true);
    try {
      const res = await onMarkPaid(expense.id);
      if (res.success) {
        onClose();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Timeline date formats
  const submittedDate = expense.created_at
    ? new Date(expense.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : expense.expense_date;

  const reviewedDate = expense.reviewed_at
    ? new Date(expense.reviewed_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            {/* HEADER */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBox, { backgroundColor: `${colors.primary}12` }]}>
                  <Feather name={iconName} size={20} color={colors.primary} />
                </View>
                <View>
                  <AppText weight="700" variant="h3" color={colors.text}>
                    {smartTitle}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Category: {expense.expense_type}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.bodyScroll} showsVerticalScrollIndicator={false}>
              {/* EXPENSE SUMMARY */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.summaryTop}>
                  <View>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Amount Claimed
                    </AppText>
                    <AppText weight="700" variant="h1" color={colors.primary}>
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </AppText>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Badge label={expense.status} color={getStatusColor(expense.status)} />
                    <Badge
                      label={expense.payment_status}
                      color={expense.payment_status === "Paid" ? colors.success : colors.warning}
                      variant="subtle"
                    />
                  </View>
                </View>

                {expense.approved_amount !== null && expense.status === "Approved" && (
                  <View style={[styles.approvedBanner, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <AppText variant="caption" weight="600" color={colors.success}>
                      Approved Amount: ₹{expense.approved_amount.toLocaleString("en-IN")}
                    </AppText>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Submitted By
                    </AppText>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <Avatar name={employeeName} size={18} />
                      <AppText weight="600" variant="caption" color={colors.text}>
                        {employeeName}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.metaCol}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Expense Date
                    </AppText>
                    <AppText weight="600" variant="caption" color={colors.text} style={{ marginTop: 2 }}>
                      {expense.expense_date}
                    </AppText>
                  </View>
                </View>

                {expense.description ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Description / Reason
                    </AppText>
                    <AppText variant="body" color={colors.text} style={{ marginTop: 2, lineHeight: 20 }}>
                      {expense.description}
                    </AppText>
                  </View>
                ) : null}
              </View>

              {/* RECEIPT PREVIEW */}
              <View style={styles.section}>
                <AppText weight="700" variant="body" color={colors.text} style={styles.sectionTitle}>
                  Receipt Attachment
                </AppText>

                {expense.receipt_url ? (
                  <View style={[styles.receiptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.receiptMain}>
                      {isPdf ? (
                        <View style={[styles.pdfBox, { backgroundColor: "#EFF6FF" }]}>
                          <Feather name="file-text" size={28} color="#2563EB" />
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setViewerVisible(true)}>
                          <Image source={{ uri: expense.receipt_url }} style={styles.receiptImg} resizeMode="cover" />
                        </TouchableOpacity>
                      )}

                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <AppText weight="600" variant="caption" color={colors.text} numberOfLines={1}>
                          {expense.receipt_name || (isPdf ? "Receipt.pdf" : "Receipt.jpg")}
                        </AppText>
                        <AppText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }}>
                          {isPdf ? "PDF Document" : "Image File"}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.receiptActions}>
                      <TouchableOpacity
                        onPress={() => setViewerVisible(true)}
                        style={[styles.receiptBtn, { backgroundColor: `${colors.primary}12` }]}
                      >
                        <Feather name={isPdf ? "file-text" : "eye"} size={14} color={colors.primary} />
                        <AppText variant="caption" weight="600" color={colors.primary}>
                          {isPdf ? "Open PDF" : "Preview"}
                        </AppText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => Linking.openURL(expense.receipt_url!)}
                        style={[styles.receiptBtn, { backgroundColor: `${colors.textSecondary}15` }]}
                      >
                        <Feather name="download" size={14} color={colors.textSecondary} />
                        <AppText variant="caption" weight="600" color={colors.textSecondary}>
                          Download
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.noReceiptBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Feather name="paperclip" size={20} color={colors.textSecondary} />
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                      No receipt attached to this expense claim.
                    </AppText>
                  </View>
                )}
              </View>

              {/* APPROVAL TIMELINE */}
              <View style={styles.section}>
                <AppText weight="700" variant="body" color={colors.text} style={styles.sectionTitle}>
                  Approval Timeline
                </AppText>

                <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Step 1: Submitted */}
                  <View style={styles.timelineStep}>
                    <View style={[styles.stepIcon, { backgroundColor: "#DCFCE7" }]}>
                      <Feather name="check" size={14} color="#16A34A" />
                    </View>
                    <View style={styles.stepContent}>
                      <AppText weight="600" variant="body" color={colors.text}>
                        Submitted
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {submittedDate}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.timelineLine} />

                  {/* Step 2: Under Review */}
                  <View style={styles.timelineStep}>
                    <View
                      style={[
                        styles.stepIcon,
                        {
                          backgroundColor:
                            expense.status === "Pending"
                              ? "#FEF3C7"
                              : "#DCFCE7",
                        },
                      ]}
                    >
                      <Feather
                        name={expense.status === "Pending" ? "clock" : "check"}
                        size={14}
                        color={expense.status === "Pending" ? "#D97706" : "#16A34A"}
                      />
                    </View>
                    <View style={styles.stepContent}>
                      <AppText weight="600" variant="body" color={colors.text}>
                        Under Review
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {expense.status === "Pending" ? "Awaiting admin action" : "Review completed"}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.timelineLine} />

                  {/* Step 3: Decision */}
                  <View style={styles.timelineStep}>
                    <View
                      style={[
                        styles.stepIcon,
                        {
                          backgroundColor:
                            expense.status === "Approved"
                              ? "#DCFCE7"
                              : expense.status === "Rejected"
                              ? "#FEE2E2"
                              : "#F3F4F6",
                        },
                      ]}
                    >
                      <Feather
                        name={
                          expense.status === "Approved"
                            ? "check-circle"
                            : expense.status === "Rejected"
                            ? "x-circle"
                            : "circle"
                        }
                        size={14}
                        color={
                          expense.status === "Approved"
                            ? "#16A34A"
                            : expense.status === "Rejected"
                            ? "#DC2626"
                            : "#9CA3AF"
                        }
                      />
                    </View>
                    <View style={styles.stepContent}>
                      <AppText weight="600" variant="body" color={colors.text}>
                        {expense.status === "Approved"
                          ? "Approved"
                          : expense.status === "Rejected"
                          ? "Rejected"
                          : "Final Approval"}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {reviewedDate ? reviewedDate : "Pending manager review"}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>

              {/* REVIEW COMMENTS & HISTORY */}
              {expense.review_comment ? (
                <View style={styles.section}>
                  <AppText weight="700" variant="body" color={colors.text} style={styles.sectionTitle}>
                    Admin Review Remarks
                  </AppText>
                  <View style={[styles.remarkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <AppText variant="caption" color={colors.textSecondary} style={{ fontStyle: "italic", lineHeight: 20 }}>
                      &quot;{expense.review_comment}&quot;
                    </AppText>
                  </View>
                </View>
              ) : null}

              {/* ADMIN REVIEW PANEL */}
              {isAdmin && expense.status === "Pending" && onReview && (
                <View style={styles.section}>
                  <AppText weight="700" variant="body" color={colors.text} style={styles.sectionTitle}>
                    Admin Decision Panel
                  </AppText>

                  <View style={[styles.reviewPanelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Input
                      label="Approved Amount (₹)"
                      placeholder={String(expense.amount)}
                      keyboardType="numeric"
                      value={approvedAmount}
                      onChangeText={setApprovedAmount}
                    />

                    <Input
                      label="Review Comments (Optional)"
                      placeholder="Enter feedback or review notes..."
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      multiline
                      numberOfLines={3}
                    />

                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button title="Approve Claim" onPress={handleApprove} loading={actionLoading} size="md" />
                      </View>
                      <TouchableOpacity
                        disabled={actionLoading}
                        onPress={handleReject}
                        style={[styles.rejectBtn, { backgroundColor: colors.danger }]}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <AppText weight="700" variant="body" color="#fff">
                            Reject Claim
                          </AppText>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* MARK PAID ACTION */}
              {isAdmin && expense.status === "Approved" && expense.payment_status === "Pending" && onMarkPaid && (
                <View style={[styles.section, { marginTop: spacing.md }]}>
                  <Button title="Mark Expense as Paid" onPress={handleMarkPaid} loading={actionLoading} size="md" />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ReceiptViewerModal
        visible={viewerVisible}
        receiptUrl={expense.receipt_url}
        receiptName={expense.receipt_name}
        receiptType={expense.receipt_type}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "90%",
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    padding: spacing.xs,
  },
  bodyScroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  approvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  metaCol: {
    flex: 1,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  receiptCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  receiptMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptImg: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
  },
  pdfBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptActions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: spacing.xs,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  noReceiptBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: {
    flex: 1,
  },
  timelineLine: {
    width: 2,
    height: 16,
    backgroundColor: "#E5E7EB",
    marginLeft: 13,
    marginVertical: 4,
  },
  remarkCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  reviewPanelCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    minHeight: 44,
  },
});
