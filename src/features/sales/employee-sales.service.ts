import { supabase } from "@/lib/supabase/client";
import { Customer, CustomerPurchase, CustomerFollowup, SalesArea } from "./sales.types";
import { Incentive } from "@/features/incentive/incentive.types";

const CUSTOMER_SELECT =
  "id, customer_code, full_name, phone, alternate_phone, email, address, sales_area_id, assigned_employee_id, status, notes, created_by, created_at, updated_at";

const CUSTOMER_PURCHASE_SELECT =
  "id, purchase_code, customer_id, amount, purchase_date, incentive_amount, status, remarks, created_by, created_at, updated_at";

const CUSTOMER_FOLLOWUP_SELECT =
  "id, customer_id, followup_date, followup_type, remarks, next_followup_date, created_by, created_at";

export async function getMyCustomers(profileId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .eq("assigned_employee_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data as Customer[];
}

export async function getMyCustomerPurchases(profileId: string): Promise<CustomerPurchase[]> {
  const customers = await getMyCustomers(profileId);
  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);

  const { data, error } = await supabase
    .from("customer_purchases")
    .select(CUSTOMER_PURCHASE_SELECT)
    .in("customer_id", customerIds)
    .order("purchase_date", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data as CustomerPurchase[];
}

export async function getMyCustomerFollowups(profileId: string): Promise<CustomerFollowup[]> {
  const customers = await getMyCustomers(profileId);
  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);

  const { data, error } = await supabase
    .from("customer_followups")
    .select(CUSTOMER_FOLLOWUP_SELECT)
    .in("customer_id", customerIds)
    .order("followup_date", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data as CustomerFollowup[];
}

export async function getMySalesAreas(profileId: string): Promise<SalesArea[]> {
  const customers = await getMyCustomers(profileId);
  if (customers.length === 0) return [];

  const areaIds = Array.from(new Set(customers.map((c) => c.sales_area_id)));

  const { data, error } = await supabase
    .from("sales_areas")
    .select("*")
    .in("id", areaIds)
    .eq("status", "Active")
    .order("area_name", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data as SalesArea[];
}

export async function getMyIncentives(profileId: string): Promise<Incentive[]> {
  const { data, error } = await supabase
    .from("incentives")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data as any[];
}

export async function getEmployeeSalesDashboardData(profileId: string) {
  const [customers, purchases, followups, incentives, salesAreas] = await Promise.all([
    getMyCustomers(profileId),
    getMyCustomerPurchases(profileId),
    getMyCustomerFollowups(profileId),
    getMyIncentives(profileId),
    getMySalesAreas(profileId),
  ]);

  const now = new Date().getTime();

  // 1. Calculations & Aggregations
  const approvedPurchases = purchases.filter((p) => p.status === "Approved");
  const totalRevenue = approvedPurchases.reduce((sum, p) => sum + p.amount, 0);

  // Current Month calculations
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1; // 1-indexed

  const currentMonthPurchases = approvedPurchases.filter((p) => {
    const pDate = new Date(p.purchase_date);
    return pDate.getFullYear() === currentYear && (pDate.getMonth() + 1) === currentMonthNum;
  });

  const monthlyRevenue = currentMonthPurchases.reduce((sum, p) => sum + p.amount, 0);
  const monthlySales = currentMonthPurchases.length;

  const totalCustomers = customers.length;
  const totalPurchases = purchases.length;

  // Followups stats
  let pendingFollowupsCount = 0;
  let completedFollowupsCount = 0;
  let todayFollowupsCount = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  followups.forEach((f) => {
    if (f.next_followup_date) {
      const nextTime = new Date(f.next_followup_date).getTime();
      if (nextTime >= todayStart.getTime() && nextTime <= todayEnd.getTime()) {
        todayFollowupsCount++;
      }
      if (nextTime >= now) {
        pendingFollowupsCount++;
      } else {
        completedFollowupsCount++;
      }
    } else {
      completedFollowupsCount++;
    }
  });

  // Earned Incentives from the incentives table (where status is Approved)
  const earnedIncentives = incentives
    .filter((i) => i.status === "Approved")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // 2. Upcoming Follow-ups (Next 5 days)
  const upcomingFollowups = followups
    .filter((f) => f.next_followup_date && new Date(f.next_followup_date).getTime() >= now)
    .sort((a, b) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime())
    .slice(0, 5)
    .map((f) => {
      const cust = customers.find((c) => c.id === f.customer_id);
      const daysLeft = Math.ceil(
        (new Date(f.next_followup_date!).getTime() - now) / (1000 * 60 * 60 * 24)
      );
      const priority = (daysLeft <= 2 ? "High" : daysLeft <= 5 ? "Medium" : "Low") as "High" | "Medium" | "Low";

      return {
        id: f.id,
        customerName: cust?.full_name || "Unknown",
        customerCode: cust?.customer_code || "N/A",
        date: f.next_followup_date!,
        priority,
        type: f.followup_type,
      };
    });

  // 3. Recent lists
  const recentCustomers = customers.slice(0, 5).map((c) => {
    const area = salesAreas.find((a) => a.id === c.sales_area_id);
    return {
      id: c.id,
      customer_code: c.customer_code,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email,
      areaName: area?.area_name || "N/A",
      status: c.status,
      created_at: c.created_at,
    };
  });

  const recentPurchases = purchases.slice(0, 5).map((p) => {
    const cust = customers.find((c) => c.id === p.customer_id);
    return {
      id: p.id,
      purchase_code: p.purchase_code,
      customerName: cust?.full_name || "Unknown",
      amount: p.amount,
      incentive_amount: p.incentive_amount,
      purchase_date: p.purchase_date,
      status: p.status,
    };
  });

  // 4. Chronological Recent Activities
  const recentActivities: { id: string; type: string; title: string; description: string; date: string }[] = [];

  customers.slice(0, 5).forEach((c) => {
    recentActivities.push({
      id: `c-${c.id}`,
      type: "Customer",
      title: "New Customer Added",
      description: `${c.full_name} (${c.customer_code}) was registered.`,
      date: c.created_at,
    });
  });

  purchases.slice(0, 5).forEach((p) => {
    const cust = customers.find((c) => c.id === p.customer_id);
    recentActivities.push({
      id: `p-${p.id}`,
      type: "Purchase",
      title: "Purchase Logged",
      description: `₹${p.amount.toLocaleString("en-IN")} logged for ${cust?.full_name || "Customer"} (${p.status}).`,
      date: p.created_at,
    });
  });

  followups.slice(0, 5).forEach((f) => {
    const cust = customers.find((c) => c.id === f.customer_id);
    recentActivities.push({
      id: `f-${f.id}`,
      type: "Followup",
      title: "Follow-up Logged",
      description: `${f.followup_type} interaction completed with ${cust?.full_name || "Customer"}.`,
      date: f.created_at,
    });
  });

  const sortedActivities = recentActivities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // 5. Monthly Trend Chart (Last 6 Months)
  const monthlyTrend: { label: string; amount: number }[] = [];
  const monthsData: { [key: string]: number } = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // Set day to 1st of the month first to prevent month overflow
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthsData[key] = 0;
  }

  approvedPurchases.forEach((p) => {
    const date = new Date(p.purchase_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthsData[key] !== undefined) {
      monthsData[key] += p.amount;
    }
  });

  Object.entries(monthsData).forEach(([key, val]) => {
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
      month: "short",
    });
    monthlyTrend.push({ label, amount: val });
  });

  return {
    stats: {
      totalRevenue,
      monthlyRevenue,
      monthlySales,
      totalCustomers,
      totalPurchases,
      pendingFollowupsCount,
      completedFollowupsCount,
      todayFollowupsCount,
      earnedIncentives,
    },
    upcomingFollowups,
    recentCustomers,
    recentPurchases,
    recentActivities: sortedActivities,
    monthlyTrend,
  };
}
