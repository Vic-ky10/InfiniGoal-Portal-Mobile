import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { Expense } from "../expense.types";
import { calculateEmployeeWallet } from "../expense.calculations";
import { ExpenseCashOut, createCashOut, getAuthenticatedProfileId } from "../expense.service";
import { toast } from "@/store/toast.store";

interface EmployeeWalletSectionProps {
  expenses: Expense[];
  cashOuts?: ExpenseCashOut[];
  onCashOutCreated?: () => void;
}

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

export default function EmployeeWalletSection({
  expenses,
  cashOuts = [],
  onCashOutCreated
}: EmployeeWalletSectionProps) {
  const [isMainOpen, setIsMainOpen] = useState(true);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHistoricalOpen, setIsHistoricalOpen] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const [isCashOutOpen, setIsCashOutOpen] = useState(true);
  const [isRecentCashInOpen, setIsRecentCashInOpen] = useState(false);
  const [isRecentCashOutOpen, setIsRecentCashOutOpen] = useState(false);

  // Form state
  const [spendAmount, setSpendAmount] = useState("");
  const [spendDesc, setSpendDesc] = useState("");
  const [spendError, setSpendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pickers state for historical listing
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const wallet = calculateEmployeeWallet(expenses, cashOuts);

  // Filter historical expenses by selected month/year
  const matchMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const filteredHistoricalExpenses = expenses.filter(
    (e) => e.expense_date && e.expense_date.startsWith(matchMonthKey)
  );
  const historicalTotalSpend = filteredHistoricalExpenses.reduce((sum, e) => sum + e.amount, 0);

  const recentCashIns = useMemo(() => {
    return expenses
      .filter((e) => e.status === "Approved")
      .sort((a, b) => new Date(b.reviewed_at || b.created_at).getTime() - new Date(a.reviewed_at || a.created_at).getTime())
      .slice(0, 3);
  }, [expenses]);

  const handleRecordCashOut = async () => {
    setSpendError(null);
    const amountNum = parseFloat(spendAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSpendError("Please enter a valid spending amount greater than 0.");
      return;
    }

    const availableBal = wallet.walletBalance ?? 0;
    if (amountNum > availableBal) {
      setSpendError("Cash Out cannot exceed the available balance.");
      return;
    }

    setLoading(true);
    try {
      const profileId = expenses[0]?.profile_id || (await getAuthenticatedProfileId());
      if (!profileId) {
        setSpendError("Could not retrieve profile ID.");
        setLoading(false);
        return;
      }
      const res = await createCashOut(profileId, amountNum, spendDesc);
      if (res.success) {
        setSpendAmount("");
        setSpendDesc("");
        toast.success("Cash Out recorded successfully.");
        if (onCashOutCreated) onCashOutCreated();
      } else {
        setSpendError(res.error || "Failed to record cash out.");
      }
    } catch (err: any) {
      setSpendError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      {/* Wallet Summary Section */}
      <Card style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsMainOpen(!isMainOpen)}
          style={styles.header}
        >
          <View style={styles.headerTitleContainer}>
            <View style={styles.iconWrapper}>
              <Feather name="credit-card" size={18} color={adminColors.text} />
            </View>
            <View>
              <AppText variant="body" weight="700" color={adminColors.text}>
                Expense Wallet
              </AppText>
              <AppText variant="caption" color={adminColors.textSecondary}>
                Balances & total personal spend metrics
              </AppText>
            </View>
          </View>
          <Feather name={isMainOpen ? "chevron-up" : "chevron-down"} size={20} color={adminColors.textSecondary} />
        </TouchableOpacity>

        {isMainOpen && (
          <View style={styles.content}>
            {/* Wallet Summary Cards Grid */}
            <View style={{ gap: spacing.sm }}>
              {/* Balance (Big Card) */}
              <View style={[styles.gridCard, { minWidth: "100%", backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                <View style={styles.gridCardHeader}>
                  <AppText variant="body" weight="700" color="#1E40AF">
                    Balance
                  </AppText>
                  <Feather name="activity" size={16} color="#1D4ED8" />
                </View>
                <AppText variant="title" weight="900" color="#1E3A8A" style={[styles.cardVal, { fontSize: 24 }]}>
                  ₹{(wallet.walletBalance ?? 0).toLocaleString("en-IN")}
                </AppText>
                <AppText variant="caption" color="#1E40AF">
                  Available wallet balance
                </AppText>
              </View>

              {/* Total Cash In & Cash Out */}
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={[styles.gridCard, { flex: 1, minWidth: undefined }]}>
                  <View style={styles.gridCardHeader}>
                    <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
                      Total Cash In
                    </AppText>
                    <Feather name="check-circle" size={14} color="#10B981" />
                  </View>
                  <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                    ₹{wallet.totalApproved.toLocaleString("en-IN")}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary}>
                    {wallet.approvedCount} approved claims
                  </AppText>
                </View>

                <View style={[styles.gridCard, { flex: 1, minWidth: undefined }]}>
                  <View style={styles.gridCardHeader}>
                    <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
                      Cash Out
                    </AppText>
                    <Feather name="trending-up" size={14} color="#6366F1" />
                  </View>
                  <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                    ₹{wallet.totalPersonalSpend.toLocaleString("en-IN")}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary}>
                    Actual spending
                  </AppText>
                </View>
              </View>

              {/* Requested & Rejected */}
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={[styles.gridCard, { flex: 1, minWidth: undefined }]}>
                  <View style={styles.gridCardHeader}>
                    <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
                      Requested
                    </AppText>
                    <Feather name="file-text" size={14} color="#3B82F6" />
                  </View>
                  <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                    ₹{wallet.totalRequested.toLocaleString("en-IN")}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary}>
                    {wallet.totalRequests} claims
                  </AppText>
                </View>

                <View style={[styles.gridCard, { flex: 1, minWidth: undefined }]}>
                  <View style={styles.gridCardHeader}>
                    <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
                      Rejected
                    </AppText>
                    <Feather name="x-circle" size={14} color="#EF4444" />
                  </View>
                  <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                    ₹{wallet.totalRejected.toLocaleString("en-IN")}
                  </AppText>
                  <AppText variant="caption" color={adminColors.textSecondary}>
                    {wallet.rejectedCount} claims
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Record Cash Out Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsCashOutOpen(!isCashOutOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Record Cash Out
          </AppText>
          <Feather name={isCashOutOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isCashOutOpen && (
          <View style={styles.accordionContent}>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
                Amount (₹)
              </AppText>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={spendAmount}
                onChangeText={setSpendAmount}
                placeholder="Enter spend amount..."
                editable={(wallet.walletBalance ?? 0) > 0}
              />
              <AppText variant="caption" weight="600" color={adminColors.textSecondary}>
                Description
              </AppText>
              <TextInput
                style={styles.textInput}
                value={spendDesc}
                onChangeText={setSpendDesc}
                placeholder="What did you spend this on?"
                editable={(wallet.walletBalance ?? 0) > 0}
              />
              {spendError && (
                <AppText variant="caption" weight="600" color="#EF4444">
                  {spendError}
                </AppText>
              )}
              <TouchableOpacity
                disabled={(wallet.walletBalance ?? 0) <= 0 || loading || !spendAmount}
                onPress={handleRecordCashOut}
                style={[
                  styles.submitBtn,
                  ((wallet.walletBalance ?? 0) <= 0 || loading || !spendAmount) && { opacity: 0.5 }
                ]}
              >
                <AppText variant="body" weight="700" color="#FFFFFF">
                  {(wallet.walletBalance ?? 0) <= 0 ? "Zero Wallet Balance" : "Save Spend"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Recent Cash In Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsRecentCashInOpen(!isRecentCashInOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Recent Cash In
          </AppText>
          <Feather name={isRecentCashInOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isRecentCashInOpen && (
          <View style={styles.accordionContent}>
            {recentCashIns.length === 0 ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ textAlign: "center", paddingVertical: 10 }}>
                No recent cash in logs
              </AppText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {recentCashIns.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={styles.flex2}>
                      <AppText variant="body" weight="600" color={adminColors.text}>
                        {item.description || item.expense_type}
                      </AppText>
                      <AppText variant="caption" color={adminColors.textSecondary}>
                        Approved • {new Date(item.reviewed_at || item.created_at).toLocaleDateString("en-IN")}
                      </AppText>
                    </View>
                    <AppText variant="body" weight="700" color="#10B981" style={[styles.flex1, styles.textRight]}>
                      ₹{(item.approved_amount ?? item.amount).toLocaleString("en-IN")}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Recent Cash Out Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsRecentCashOutOpen(!isRecentCashOutOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Recent Cash Out
          </AppText>
          <Feather name={isRecentCashOutOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isRecentCashOutOpen && (
          <View style={styles.accordionContent}>
            {(!cashOuts || cashOuts.length === 0) ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ textAlign: "center", paddingVertical: 10 }}>
                No spending recorded yet
              </AppText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {cashOuts.map((c) => (
                  <View key={c.id} style={styles.tableRow}>
                    <View style={styles.flex2}>
                      <AppText variant="body" weight="600" color={adminColors.text}>
                        {c.description || "General Spending"}
                      </AppText>
                      <AppText variant="caption" color={adminColors.textSecondary}>
                        {new Date(c.created_at).toLocaleDateString("en-IN")}
                      </AppText>
                    </View>
                    <AppText variant="body" weight="700" color={adminColors.text} style={[styles.flex1, styles.textRight]}>
                      ₹{c.amount.toLocaleString("en-IN")}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Historical Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsHistoricalOpen(!isHistoricalOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Monthly Spending History
          </AppText>
          <Feather name={isHistoricalOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isHistoricalOpen && (
          <View style={styles.accordionContent}>
            {/* Horizontal scrolls for Months and Years */}
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              {/* Year Select Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {YEAR_OPTIONS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => setSelectedYear(year)}
                    style={[styles.pickerBtn, selectedYear === year && styles.pickerBtnActive]}
                  >
                    <AppText variant="caption" weight="600" color={selectedYear === year ? "#FFFFFF" : adminColors.text}>
                      {year}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Month Select Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {MONTH_NAMES_SHORT.map((mon, index) => (
                  <TouchableOpacity
                    key={mon}
                    onPress={() => setSelectedMonth(index)}
                    style={[styles.pickerBtn, selectedMonth === index && styles.pickerBtnActive]}
                  >
                    <AppText variant="caption" weight="600" color={selectedMonth === index ? "#FFFFFF" : adminColors.text}>
                      {mon}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Claims Table */}
            {filteredHistoricalExpenses.length === 0 ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ textAlign: "center", paddingVertical: 20 }}>
                No expense claims found for this period.
              </AppText>
            ) : (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={styles.flex2}>Date & Details</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>Status</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex2, styles.textRight]}>Amount</AppText>
                </View>
                {filteredHistoricalExpenses.map((row) => (
                  <View key={row.id} style={styles.tableRow}>
                    <View style={styles.flex2}>
                      <AppText variant="caption" color={adminColors.textSecondary}>
                        {new Date(row.expense_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </AppText>
                      <AppText variant="body" weight="600" color={adminColors.text} numberOfLines={1}>
                        {row.description || "Untitled"}
                      </AppText>
                      <AppText variant="caption" color={adminColors.textSecondary} numberOfLines={1}>
                        {row.expense_type}
                      </AppText>
                    </View>
                    <View style={styles.flex1}>
                      <AppText
                        variant="caption"
                        weight="600"
                        style={[
                          styles.textRight,
                          {
                            color:
                              row.status === "Approved"
                                ? "#10B981"
                                : row.status === "Rejected"
                                ? "#EF4444"
                                : "#F59E0B"
                          }
                        ]}
                      >
                        {row.status}
                      </AppText>
                    </View>
                    <AppText variant="body" weight="700" color={adminColors.text} style={[styles.flex2, styles.textRight]}>
                      ₹{row.amount.toLocaleString("en-IN")}
                    </AppText>
                  </View>
                ))}
              </View>
            )}

            {/* Bottom totals summary */}
            <View style={styles.totalsSummaryBox}>
              <AppText variant="caption" color={adminColors.textSecondary} weight="600">
                Total Claims: {filteredHistoricalExpenses.length}
              </AppText>
              <AppText variant="body" weight="700" color={adminColors.text}>
                Total Spent: ₹{historicalTotalSpend.toLocaleString("en-IN")}
              </AppText>
            </View>
          </View>
        )}
      </View>

      {/* Statistics Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsStatsOpen(!isStatsOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Expense Statistics
          </AppText>
          <Feather name={isStatsOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isStatsOpen && (
          <View style={styles.accordionContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Pending Claims</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text}>{wallet.pendingCount}</AppText>
                </View>
                <View style={styles.statsCol}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Approved Claims</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text}>{wallet.approvedCount}</AppText>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Average Amount</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text}>₹{Math.round(wallet.averageExpense).toLocaleString("en-IN")}</AppText>
                </View>
                <View style={styles.statsCol}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Total Claims</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text}>{wallet.totalRequests}</AppText>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Highest Expense</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text}>₹{wallet.highestExpense.toLocaleString("en-IN")}</AppText>
                </View>
                <View style={styles.statsCol}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Lowest Expense</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text}>₹{wallet.lowestExpense.toLocaleString("en-IN")}</AppText>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Category Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsCategoryOpen(!isCategoryOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Category Spending Breakdown
          </AppText>
          <Feather name={isCategoryOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isCategoryOpen && (
          <View style={styles.accordionContent}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={styles.flex2}>Category</AppText>
                <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>Claims</AppText>
                <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex2, styles.textRight]}>Total Amount</AppText>
              </View>
              {wallet.categorySummary.map((row, idx) => (
                <View key={row.category || idx} style={styles.tableRow}>
                  <AppText variant="body" weight="600" color={adminColors.text} style={styles.flex2}>{row.category}</AppText>
                  <AppText variant="body" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>{row.count}</AppText>
                  <AppText variant="body" weight="700" color={adminColors.text} style={[styles.flex2, styles.textRight]}>₹{row.amount.toLocaleString("en-IN")}</AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Recent Activity Accordion */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsActivityOpen(!isActivityOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Recent Expense Activity
          </AppText>
          <Feather name={isActivityOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isActivityOpen && (
          <View style={styles.accordionContent}>
            {wallet.recentActivity.length === 0 ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ textAlign: "center", paddingVertical: 10 }}>
                No recent activities
              </AppText>
            ) : (
              <View style={{ gap: spacing.md }}>
                {wallet.recentActivity.map((act) => {
                  let statusText = "Submitted";
                  let color = "#3B82F6";
                  let bg = "#EFF6FF";

                  if (act.status === "Approved") {
                    statusText = "Approved";
                    color = "#10B981";
                    bg = "#ECFDF5";
                  } else if (act.status === "Rejected") {
                    statusText = "Rejected";
                    color = "#EF4444";
                    bg = "#FEF2F2";
                  }

                  return (
                    <View key={act.id} style={styles.activityItem}>
                      <View style={[styles.statusTag, { backgroundColor: bg }]}>
                        <AppText variant="caption" weight="700" color={color} style={{ fontSize: 9 }}>
                          {statusText}
                        </AppText>
                      </View>
                      <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                        <AppText variant="body" weight="600" color={adminColors.text} numberOfLines={1}>
                          {act.description || act.expense_type}
                        </AppText>
                        <AppText variant="caption" color={adminColors.textSecondary}>
                          {new Date(act.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}
                        </AppText>
                      </View>
                      <AppText variant="body" weight="700" color={adminColors.text}>
                        ₹{act.amount.toLocaleString("en-IN")}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: adminColors.border,
    ...shadows.sm,
    padding: 0,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#FDFDFD",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
  },
  content: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: spacing.md,
  },
  gridCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  gridCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardVal: {
    fontSize: 18,
    marginTop: spacing.xs,
  },
  accordionContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFFFFF",
  },
  accordionContent: {
    padding: spacing.md,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  pickerRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  pickerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  pickerBtnActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statsCol: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    alignItems: "center",
  },
  tableHeaderRow: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderBottomWidth: 0,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  textRight: { textAlign: "right" },
  totalsSummaryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statusTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: adminColors.text,
  },
  submitBtn: {
    backgroundColor: adminColors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },
});
