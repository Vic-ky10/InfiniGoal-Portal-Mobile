export const SALES_AREA_PREFIX = "AREA";
export const CUSTOMER_PREFIX = "CUS";
export const PURCHASE_PREFIX = "PUR";

export const CODE_PADDING = 4;

export const SALES_AREA_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export const CUSTOMER_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  BLOCKED: "Blocked",
} as const;

export const PURCHASE_STATUS = {
  NOT_ELIGIBLE: "Not Eligible",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const FOLLOWUP_TYPES = {
  CALL: "Call",
  VISIT: "Visit",
  WHATSAPP: "WhatsApp",
  MEETING: "Meeting",
  OTHER: "Other",
} as const;

export const INCENTIVE_RULE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;
