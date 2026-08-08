import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText } from "@/components/ui";
import { adminColors, spacing, radius, shadows } from "@/theme";
import { ExpenseWithEmployee } from "../expense.types";
import { ExpenseCashOut } from "../expense.service";
import { calculateAdminAnalytics } from "../expense.calculations";
import ExpenseOverviewSection from "@/features/dashboard/components/ExpenseOverviewSection";

interface AdminExpenseAnalyticsSectionProps {
  expenses: ExpenseWithEmployee[];
  cashOuts?: ExpenseCashOut[];
}

export default function AdminExpenseAnalyticsSection({ expenses, cashOuts = [] }: AdminExpenseAnalyticsSectionProps) {
  const [isMainOpen, setIsMainOpen] = useState(true);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const analytics = useMemo(() => {
    return calculateAdminAnalytics(expenses, cashOuts);
  }, [expenses, cashOuts]);

  return (
    <View style={{ gap: spacing.md }}>
      {/* Company Summary Cards */}
      <Card style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsMainOpen(!isMainOpen)}
          style={styles.header}
        >
          <View style={styles.headerTitleContainer}>
            <View style={styles.iconWrapper}>
              <Feather name="bar-chart-2" size={18} color={adminColors.text} />
            </View>
            <View>
              <AppText variant="body" weight="700" color={adminColors.text}>
                Organization Summary
              </AppText>
              <AppText variant="caption" color={adminColors.textSecondary}>
                Overall company expense summary cards
              </AppText>
            </View>
          </View>
          <Feather name={isMainOpen ? "chevron-up" : "chevron-down"} size={20} color={adminColors.textSecondary} />
        </TouchableOpacity>

        {isMainOpen && (
          <View style={styles.content}>
            <View style={styles.cardGrid}>
              <View style={styles.gridCard}>
                <AppText variant="caption" color={adminColors.textSecondary}>Claims</AppText>
                <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                  {analytics.totalExpenseCount}
                </AppText>
              </View>

              <View style={styles.gridCard}>
                <AppText variant="caption" color={adminColors.textSecondary}>Requested</AppText>
                <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                  ₹{analytics.totalCompanyExpense.toLocaleString("en-IN")}
                </AppText>
              </View>

              <View style={styles.gridCard}>
                <AppText variant="caption" color={adminColors.textSecondary}>Approved</AppText>
                <AppText variant="body" weight="700" color="#10B981" style={styles.cardVal}>
                  ₹{analytics.approvedAmount.toLocaleString("en-IN")}
                </AppText>
              </View>

              <View style={styles.gridCard}>
                <AppText variant="caption" color={adminColors.textSecondary}>Pending</AppText>
                <AppText variant="body" weight="700" color="#F59E0B" style={styles.cardVal}>
                  ₹{analytics.pendingAmount.toLocaleString("en-IN")}
                </AppText>
              </View>

              <View style={styles.gridCard}>
                <AppText variant="caption" color={adminColors.textSecondary}>Rejected</AppText>
                <AppText variant="body" weight="700" color="#EF4444" style={styles.cardVal}>
                  ₹{analytics.rejectedAmount.toLocaleString("en-IN")}
                </AppText>
              </View>

              <View style={styles.gridCard}>
                <AppText variant="caption" color={adminColors.textSecondary}>Average</AppText>
                <AppText variant="body" weight="700" color={adminColors.text} style={styles.cardVal}>
                  ₹{Math.round(analytics.averageExpenseValue).toLocaleString("en-IN")}
                </AppText>
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Monthly Expense Overview Section (Reused Dashboard Component) */}
      <ExpenseOverviewSection mode="admin" theme="admin" showViewAll={false} />

      {/* Strategic Spending Insights */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsInsightsOpen(!isInsightsOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Strategic Spend Insights
          </AppText>
          <Feather name={isInsightsOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isInsightsOpen && (
          <View style={styles.accordionContent}>
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Feather name="user" size={14} color={adminColors.textSecondary} />
                <View style={styles.insightTextContainer}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Highest Spender</AppText>
                  <AppText variant="body" weight="600" color={adminColors.text}>{analytics.topInsights.highestSpendingEmployee}</AppText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Feather name="activity" size={14} color={adminColors.textSecondary} />
                <View style={styles.insightTextContainer}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Most Active</AppText>
                  <AppText variant="body" weight="600" color={adminColors.text}>{analytics.topInsights.mostActiveEmployee}</AppText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Feather name="briefcase" size={14} color={adminColors.textSecondary} />
                <View style={styles.insightTextContainer}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Top Department</AppText>
                  <AppText variant="body" weight="600" color={adminColors.text}>{analytics.topInsights.highestSpendingDepartment}</AppText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Feather name="grid" size={14} color={adminColors.textSecondary} />
                <View style={styles.insightTextContainer}>
                  <AppText variant="caption" color={adminColors.textSecondary}>Top Category</AppText>
                  <AppText variant="body" weight="600" color={adminColors.text}>{analytics.topInsights.mostUsedCategory}</AppText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Feather name="check" size={14} color="#10B981" />
                <View style={styles.insightTextContainer}>
                  <AppText variant="caption" color="#10B981">Largest Approved Claim</AppText>
                  <AppText variant="body" weight="600" color={adminColors.text}>
                    {analytics.topInsights.largestApprovedExpense
                      ? `₹${analytics.topInsights.largestApprovedExpense.amount.toLocaleString("en-IN")} (${analytics.topInsights.largestApprovedExpense.employeeName})`
                      : "None"}
                  </AppText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Feather name="clock" size={14} color="#F59E0B" />
                <View style={styles.insightTextContainer}>
                  <AppText variant="caption" color="#F59E0B">Largest Pending Claim</AppText>
                  <AppText variant="body" weight="600" color={adminColors.text}>
                    {analytics.topInsights.largestPendingExpense
                      ? `₹${analytics.topInsights.largestPendingExpense.amount.toLocaleString("en-IN")} (${analytics.topInsights.largestPendingExpense.employeeName})`
                      : "None"}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Employee Wallet Overview Table */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsWalletOpen(!isWalletOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Employee Wallet Overview
          </AppText>
          <Feather name={isWalletOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isWalletOpen && (
          <View style={styles.accordionContent}>
            {analytics.employeeWalletOverview.length === 0 ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ textAlign: "center", paddingVertical: 10 }}>
                No wallet data available
              </AppText>
            ) : (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={styles.flex2}>Employee</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>₹-In</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>₹-Out</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>Balance</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>Pending</AppText>
                </View>
                {analytics.employeeWalletOverview.map((row, idx) => (
                  <View key={row.profileId || idx} style={styles.tableRow}>
                    <View style={styles.flex2}>
                      <AppText variant="body" weight="600" color={adminColors.text} numberOfLines={1}>{row.name}</AppText>
                      <AppText variant="caption" color={adminColors.textSecondary} numberOfLines={1}>{row.department}</AppText>
                    </View>
                    <AppText variant="body" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>₹{row.totalApproved.toLocaleString("en-IN")}</AppText>
                    <AppText variant="body" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>₹{row.totalSpent.toLocaleString("en-IN")}</AppText>
                    <AppText variant="body" weight="700" color="#10B981" style={[styles.flex1, styles.textRight]}>₹{(row.walletBalance ?? 0).toLocaleString("en-IN")}</AppText>
                    <AppText variant="body" color={adminColors.textSecondary} style={[styles.flex1, styles.textRight]}>₹{row.totalPending.toLocaleString("en-IN")}</AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Department Summary Table */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsDeptOpen(!isDeptOpen)}
          style={styles.accordionHeader}
        >
          <AppText variant="body" weight="700" color={adminColors.text}>
            Department Expense Summary
          </AppText>
          <Feather name={isDeptOpen ? "minus" : "plus"} size={16} color={adminColors.textSecondary} />
        </TouchableOpacity>
        {isDeptOpen && (
          <View style={styles.accordionContent}>
            {analytics.departmentSummary.length === 0 ? (
              <AppText variant="caption" color={adminColors.textSecondary} style={{ textAlign: "center", paddingVertical: 10 }}>
                No department data available
              </AppText>
            ) : (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={styles.flex2}>Department</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex1, styles.textCenter]}>Requests</AppText>
                  <AppText variant="caption" weight="700" color={adminColors.textSecondary} style={[styles.flex2, styles.textRight]}>Approved Amt</AppText>
                </View>
                {analytics.departmentSummary.map((row, idx) => (
                  <View key={row.department || idx} style={styles.tableRow}>
                    <AppText variant="body" weight="600" color={adminColors.text} style={styles.flex2}>{row.department}</AppText>
                    <AppText variant="body" color={adminColors.textSecondary} style={[styles.flex1, styles.textCenter]}>{row.totalRequests}</AppText>
                    <AppText variant="body" weight="700" color={adminColors.text} style={[styles.flex2, styles.textRight]}>₹{row.approvedAmount.toLocaleString("en-IN")}</AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Category Summary Table (Without percentage column) */}
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
              {analytics.categorySummary.map((row, idx) => (
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
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    minWidth: "30%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cardVal: {
    fontSize: 14,
    marginTop: 2,
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
  insightsList: {
    gap: spacing.sm,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: radius.md,
  },
  insightTextContainer: {
    flex: 1,
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
  textCenter: { textAlign: "center" },
});
