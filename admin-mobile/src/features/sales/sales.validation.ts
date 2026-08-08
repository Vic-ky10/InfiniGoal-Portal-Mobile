import { z } from "zod";

export const salesAreaSchema = z.object({
  area_name: z.string().min(2, "Area name must be at least 2 characters").max(100),
  area_type: z.enum([
    "Apartment",
    "Company",
    "Office",
    "Shop",
    "Residential",
    "Other",
  ]),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]),
});

export const customerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  alternate_phone: z.string().optional().nullable().refine(val => !val || /^\d{10}$/.test(val), "Alternate phone number must be exactly 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  sales_area_id: z.string().uuid("Please select a sales area"),
  assigned_employee_id: z.string().uuid("Please assign a staff member"),
  status: z.enum(["Active", "Inactive", "Blocked"]),
  notes: z.string().optional().nullable(),
});

export const customerPurchaseSchema = z.object({
  customer_id: z.string().uuid("Please select a customer"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  purchase_date: z.string().min(1, "Please select a date"),
  remarks: z.string().optional().nullable(),
  status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
  incentive_status: z
    .enum(["Not Eligible", "Eligible", "Pending Review", "Approved", "Rejected"])
    .optional(),
});

export const customerFollowupSchema = z.object({
  customer_id: z.string().uuid("Please select a customer"),
  followup_date: z.string().optional(),
  followup_type: z.enum([
    "Call",
    "Visit",
    "WhatsApp",
    "Meeting",
    "Other",
  ]),
  remarks: z.string().optional().nullable(),
  next_followup_date: z.string().optional().nullable(),
});

export const incentiveRuleSchema = z.object({
  minimum_purchase: z.coerce.number().positive("Minimum purchase must be greater than 0"),
  incentive_amount: z.coerce.number().positive("Incentive amount must be greater than 0"),
  status: z.enum(["Active", "Inactive"]),
});

export type SalesAreaForm = z.infer<typeof salesAreaSchema>;
export type CustomerForm = z.infer<typeof customerSchema>;
export type CustomerPurchaseForm = z.infer<typeof customerPurchaseSchema>;
export type CustomerFollowupForm = z.infer<typeof customerFollowupSchema>;
export type IncentiveRuleForm = z.infer<typeof incentiveRuleSchema>;
