import { Expense, ExpenseWithEmployee, EXPENSE_STATUS } from "./expense.types";
import { ExpenseCashOut } from "./expense.service";

export interface MonthlyPurchaseRow {
  month: string; // e.g. "January" or "January 2026"
  expensesCount: number;
  amount: number;
}

export interface CategorySummaryRow {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface EmployeeMonthlySpendingRow {
  profileId: string;
  name: string;
  department: string;
  currentMonthSpend: number;
  previousMonthSpend: number;
  totalApprovedAmount: number;
  requestCount: number;
}

export interface EmployeeWalletOverviewRow {
  profileId: string;
  name: string;
  department: string;
  walletBalance: number | null;
  totalApproved: number;
  totalPending: number;
  totalSpent: number;
  remainingBalance: number | null;
}

export interface DepartmentSummaryRow {
  department: string;
  totalRequests: number;
  approvedAmount: number;
}

export interface TopInsights {
  highestSpendingEmployee: string;
  mostActiveEmployee: string;
  highestSpendingDepartment: string;
  mostUsedCategory: string;
  largestApprovedExpense: { amount: number; code: string; employeeName: string } | null;
  largestPendingExpense: { amount: number; code: string; employeeName: string } | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


export function formatMonthKey(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [year, month] = monthKey.split("-");
  const monthIdx = parseInt(month, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES[monthIdx]} ${year}`;
  }
  return monthKey;
}

export function calculateEmployeeWallet(expenses: Expense[], cashOuts: ExpenseCashOut[] = []) {
  let totalRequested = 0;
  let totalApproved = 0;
  let totalRejected = 0;
  let totalPersonalSpend = 0;
  
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  expenses.forEach(e => {
    totalRequested += e.amount;
    if (e.status === EXPENSE_STATUS.APPROVED) {
      const appAmt = e.approved_amount !== null && e.approved_amount !== undefined ? e.approved_amount : e.amount;
      totalApproved += appAmt;
      approvedCount += 1;
    } else if (e.status === EXPENSE_STATUS.REJECTED) {
      totalRejected += e.amount;
      rejectedCount += 1;
    } else if (e.status === EXPENSE_STATUS.PENDING) {
      pendingCount += 1;
    }
  });

  // Calculate actual spending (Cash Out) from expense_cash_outs
  totalPersonalSpend = cashOuts.reduce((sum, c) => sum + c.amount, 0);

  const balance = totalApproved - totalPersonalSpend;

  const totalRequests = expenses.length;
  const averageExpense = totalRequests > 0 ? totalRequested / totalRequests : 0;
  
  const amounts = expenses.map(e => e.amount);
  const highestExpense = amounts.length > 0 ? Math.max(...amounts) : 0;
  const lowestExpense = amounts.length > 0 ? Math.min(...amounts) : 0;

  // Monthly Purchase Summary
  const monthlyMap: Record<string, { count: number; amount: number }> = {};
  expenses.forEach(e => {
    if (e.expense_date) {
      const key = e.expense_date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[key]) {
        monthlyMap[key] = { count: 0, amount: 0 };
      }
      monthlyMap[key].count += 1;
      monthlyMap[key].amount += e.amount;
    }
  });

  const monthlySummary: MonthlyPurchaseRow[] = Object.entries(monthlyMap)
    .map(([key, val]) => ({
      month: formatMonthKey(key),
      expensesCount: val.count,
      amount: val.amount
    }))
    .sort((a, b) => b.month.localeCompare(a.month)); // Latest months first


  const displayCategories = ["Travel", "Food", "Fuel", "Office", "Accommodation", "Medical", "Other"];
  const categoryMapping: Record<string, string> = {
    "Travel": "Travel",
    "Food": "Food",
    "Petrol Charges": "Fuel",
    "Office Supplies": "Office",
    "Accommodation": "Accommodation",
    "Products": "Other",
    "Other": "Other"
  };

  const categoryStats = displayCategories.map(cat => ({
    category: cat,
    amount: 0,
    count: 0,
    percentage: 0
  }));

  expenses.forEach(e => {
    const mappedCat = categoryMapping[e.expense_type] || "Other";
    const stat = categoryStats.find(s => s.category === mappedCat);
    if (stat) {
      stat.amount += e.amount;
      stat.count += 1;
    }
  });

  categoryStats.forEach(stat => {
    stat.percentage = totalRequested > 0 ? (stat.amount / totalRequested) * 100 : 0;
  });

  // Recent activity logs (Submitted, Approved, Rejected)
  const recentActivity = [...expenses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    totalRequested,
    totalApproved,
    totalRejected,
    totalPersonalSpend,
    walletBalance: balance,
    remainingBalance: balance,
    totalRequests,
    pendingCount,
    approvedCount,
    rejectedCount,
    averageExpense,
    highestExpense,
    lowestExpense,
    monthlySummary,
    categorySummary: categoryStats,
    recentActivity
  };
}

export function calculateAdminAnalytics(expenses: ExpenseWithEmployee[], cashOuts: ExpenseCashOut[] = []) {
  let totalCompanyExpense = 0;
  let approvedAmount = 0;
  let pendingAmount = 0;
  let rejectedAmount = 0;

  expenses.forEach(e => {
    totalCompanyExpense += e.amount;
    if (e.status === EXPENSE_STATUS.APPROVED) {
      approvedAmount += e.approved_amount !== null && e.approved_amount !== undefined ? e.approved_amount : e.amount;
    } else if (e.status === EXPENSE_STATUS.PENDING) {
      pendingAmount += e.amount;
    } else if (e.status === EXPENSE_STATUS.REJECTED) {
      rejectedAmount += e.amount;
    }
  });

  const totalExpenseCount = expenses.length;
  const averageExpenseValue = totalExpenseCount > 0 ? totalCompanyExpense / totalExpenseCount : 0;

  // Monthly Spending Comparison (for current month & previous month)
  const now = new Date();
  const formatKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthKey = formatKey(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = formatKey(previousMonthDate);

  // Group by Employee Profile for Monthly Spending & Wallet Overview tables
  const employeeMap: Record<
    string,
    {
      profileId: string;
      name: string;
      department: string;
      currentMonthSpend: number;
      previousMonthSpend: number;
      totalApproved: number;
      totalPending: number;
      requestCount: number;
    }
  > = {};

  expenses.forEach(e => {
    const pId = e.profile_id;
    if (!employeeMap[pId]) {
      employeeMap[pId] = {
        profileId: pId,
        name: e.employee?.full_name || "Unknown",
        department: e.employee?.department || "Other",
        currentMonthSpend: 0,
        previousMonthSpend: 0,
        totalApproved: 0,
        totalPending: 0,
        requestCount: 0,
      };
    }

    const row = employeeMap[pId];
    row.requestCount += 1;

    // Monthly aggregation
    if (e.expense_date) {
      const expMonth = e.expense_date.substring(0, 7);
      if (expMonth === currentMonthKey) {
        row.currentMonthSpend += e.amount;
      } else if (expMonth === previousMonthKey) {
        row.previousMonthSpend += e.amount;
      }
    }

    // Status aggregation
    if (e.status === EXPENSE_STATUS.APPROVED) {
      row.totalApproved += e.approved_amount !== null && e.approved_amount !== undefined ? e.approved_amount : e.amount;
    } else if (e.status === EXPENSE_STATUS.PENDING) {
      row.totalPending += e.amount;
    }
  });

  const employeeMonthlySpending: EmployeeMonthlySpendingRow[] = Object.values(employeeMap).map(emp => ({
    profileId: emp.profileId,
    name: emp.name,
    department: emp.department,
    currentMonthSpend: emp.currentMonthSpend,
    previousMonthSpend: emp.previousMonthSpend,
    totalApprovedAmount: emp.totalApproved,
    requestCount: emp.requestCount,
  }));

  const cashOutMap: Record<string, number> = {};
  cashOuts.forEach(c => {
    cashOutMap[c.profile_id] = (cashOutMap[c.profile_id] || 0) + c.amount;
  });

  const employeeWalletOverview: EmployeeWalletOverviewRow[] = Object.values(employeeMap).map(emp => {
    const totalSpent = cashOutMap[emp.profileId] || 0;
    const balance = emp.totalApproved - totalSpent;
    return {
      profileId: emp.profileId,
      name: emp.name,
      department: emp.department,
      walletBalance: balance,
      totalApproved: emp.totalApproved,
      totalPending: emp.totalPending,
      totalSpent: totalSpent,
      remainingBalance: balance,
    };
  });

  // Department Breakdown
  const deptMap: Record<string, { requests: number; approved: number }> = {};
  expenses.forEach(e => {
    const dept = e.employee?.department || "Other";
    if (!deptMap[dept]) {
      deptMap[dept] = { requests: 0, approved: 0 };
    }
    deptMap[dept].requests += 1;
    if (e.status === EXPENSE_STATUS.APPROVED) {
      deptMap[dept].approved += e.approved_amount !== null && e.approved_amount !== undefined ? e.approved_amount : e.amount;
    }
  });

  const departmentSummary: DepartmentSummaryRow[] = Object.entries(deptMap).map(([dept, val]) => ({
    department: dept,
    totalRequests: val.requests,
    approvedAmount: val.approved
  }));

  // Category Breakdown (display standard categories)
  const displayCategories = ["Travel", "Food", "Fuel", "Office", "Accommodation", "Medical", "Other"];
  const categoryMapping: Record<string, string> = {
    "Travel": "Travel",
    "Food": "Food",
    "Petrol Charges": "Fuel",
    "Office Supplies": "Office",
    "Accommodation": "Accommodation",
    "Products": "Other",
    "Other": "Other"
  };

  const categoryStats = displayCategories.map(cat => ({
    category: cat,
    amount: 0,
    count: 0,
    percentage: 0
  }));

  expenses.forEach(e => {
    const mappedCat = categoryMapping[e.expense_type] || "Other";
    const stat = categoryStats.find(s => s.category === mappedCat);
    if (stat) {
      stat.amount += e.amount;
      stat.count += 1;
    }
  });

  categoryStats.forEach(stat => {
    stat.percentage = totalCompanyExpense > 0 ? (stat.amount / totalCompanyExpense) * 100 : 0;
  });


  let highestSpendingEmployee = "None";
  let maxSpend = -1;
  employeeMonthlySpending.forEach(emp => {
    if (emp.totalApprovedAmount > maxSpend) {
      maxSpend = emp.totalApprovedAmount;
      highestSpendingEmployee = emp.name;
    }
  });

  // 2. Most Active Employee (Most requests count)
  let mostActiveEmployee = "None";
  let maxRequests = -1;
  employeeMonthlySpending.forEach(emp => {
    if (emp.requestCount > maxRequests) {
      maxRequests = emp.requestCount;
      mostActiveEmployee = emp.name;
    }
  });

  // 3. Highest Spending Department (Highest total approved amount)
  let highestSpendingDepartment = "None";
  let maxDeptSpend = -1;
  departmentSummary.forEach(dept => {
    if (dept.approvedAmount > maxDeptSpend) {
      maxDeptSpend = dept.approvedAmount;
      highestSpendingDepartment = dept.department;
    }
  });

  // 4. Most Used Category (highest count)
  let mostUsedCategory = "None";
  let maxCatClaims = -1;
  categoryStats.forEach(cat => {
    if (cat.count > maxCatClaims) {
      maxCatClaims = cat.count;
      mostUsedCategory = cat.category;
    }
  });

  // 5. Largest Approved Expense
  let largestApprovedExpense: TopInsights["largestApprovedExpense"] = null;
  let maxApprovedVal = -1;
  // 6. Largest Pending Expense
  let largestPendingExpense: TopInsights["largestPendingExpense"] = null;
  let maxPendingVal = -1;

  expenses.forEach(e => {
    const name = e.employee?.full_name || "Unknown";
    if (e.status === EXPENSE_STATUS.APPROVED) {
      const val = e.approved_amount !== null && e.approved_amount !== undefined ? e.approved_amount : e.amount;
      if (val > maxApprovedVal) {
        maxApprovedVal = val;
        largestApprovedExpense = { amount: val, code: e.expense_code, employeeName: name };
      }
    } else if (e.status === EXPENSE_STATUS.PENDING) {
      if (e.amount > maxPendingVal) {
        maxPendingVal = e.amount;
        largestPendingExpense = { amount: e.amount, code: e.expense_code, employeeName: name };
      }
    }
  });

  const topInsights: TopInsights = {
    highestSpendingEmployee: maxSpend > 0 ? `${highestSpendingEmployee} (₹${maxSpend.toLocaleString("en-IN")})` : "None",
    mostActiveEmployee: maxRequests > 0 ? `${mostActiveEmployee} (${maxRequests} claims)` : "None",
    highestSpendingDepartment: maxDeptSpend > 0 ? `${highestSpendingDepartment} (₹${maxDeptSpend.toLocaleString("en-IN")})` : "None",
    mostUsedCategory: maxCatClaims > 0 ? `${mostUsedCategory} (${maxCatClaims} claims)` : "None",
    largestApprovedExpense,
    largestPendingExpense
  };

  return {
    totalCompanyExpense,
    approvedAmount,
    pendingAmount,
    rejectedAmount,
    totalExpenseCount,
    averageExpenseValue,
    employeeMonthlySpending,
    employeeWalletOverview,
    departmentSummary,
    categorySummary: categoryStats,
    topInsights
  };
}
