export interface SalesArea {
  id: string;
  area_code: string;
  area_name: string;
  area_type:
    | "Apartment"
    | "Company"
    | "Office"
    | "Shop"
    | "Residential"
    | "Other";
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: "Active" | "Inactive";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  sales_area_id: string;
  assigned_employee_id: string;
  status: "Active" | "Inactive" | "Blocked";
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRemarksMeta {
  incentive_status: "Not Eligible" | "Eligible" | "Pending Review" | "Approved" | "Rejected";
  remarks: string;
}

export interface CustomerPurchase {
  id: string;
  purchase_code: string;
  customer_id: string;
  amount: number;
  purchase_date: string;
  incentive_amount: number;
  status: "Pending" | "Approved" | "Rejected" | "Not Eligible";
  remarks: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFollowup {
  id: string;
  customer_id: string;
  followup_date: string;
  followup_type:
    | "Call"
    | "Visit"
    | "WhatsApp"
    | "Meeting"
    | "Other";
  remarks: string | null;
  next_followup_date: string | null;
  created_by: string;
  created_at: string;
}

export interface IncentiveRule {
  id: string;
  minimum_purchase: number;
  incentive_amount: number;
  status: "Active" | "Inactive";
  created_by: string;
  created_at: string;
  updated_at: string;
}
