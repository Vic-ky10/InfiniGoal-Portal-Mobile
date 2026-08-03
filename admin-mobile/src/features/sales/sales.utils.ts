import { PurchaseRemarksMeta, CustomerPurchase } from "./sales.types";

export function parsePurchaseRemarks(
  remarksStr: string | null,
  dbStatus: string
): PurchaseRemarksMeta {
  let fallback_status: PurchaseRemarksMeta["incentive_status"] = "Not Eligible";
  if (dbStatus === "Approved") {
    fallback_status = "Approved";
  } else if (dbStatus === "Pending") {
    fallback_status = "Pending Review";
  } else if (dbStatus === "Rejected") {
    fallback_status = "Rejected";
  } else if (dbStatus === "Not Eligible") {
    fallback_status = "Not Eligible";
  }

  if (remarksStr) {
    const trimmed = remarksStr.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          const status = parsed.incentive_status || fallback_status;
          let innerRemarks = parsed.remarks !== undefined && parsed.remarks !== null ? String(parsed.remarks) : "";
          
          if (innerRemarks.trim().startsWith("{") && innerRemarks.trim().endsWith("}")) {
            try {
              const innerParsed = JSON.parse(innerRemarks.trim());
              if (innerParsed && typeof innerParsed === "object") {
                innerRemarks = innerParsed.remarks !== undefined && innerParsed.remarks !== null ? String(innerParsed.remarks) : "";
              }
            } catch {
              // ignore
            }
          }
          
          return {
            incentive_status: status,
            remarks: innerRemarks,
          };
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    incentive_status: fallback_status,
    remarks: remarksStr || "",
  };
}

export function serializePurchaseRemarks(meta: PurchaseRemarksMeta): string {
  return JSON.stringify(meta);
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getMonthlyRevenueChartData(purchases: CustomerPurchase[]): { label: string; amount: number }[] {
  const approved = purchases.filter((p) => p.status === "Approved");
  const monthsData: { [key: string]: number } = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // Prevent month overflow
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthsData[key] = 0;
  }

  approved.forEach((p) => {
    const date = new Date(p.purchase_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthsData[key] !== undefined) {
      monthsData[key] += p.amount;
    }
  });

  return Object.entries(monthsData).map(([key, val]) => {
    const [, month] = key.split("-");
    const label = SHORT_MONTHS[Number(month) - 1];
    return { label, amount: val };
  });
}
