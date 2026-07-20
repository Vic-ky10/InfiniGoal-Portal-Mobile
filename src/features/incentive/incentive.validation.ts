import { z } from "zod";

import {
  INCENTIVE_STATUS,
  INCENTIVE_TYPE,
} from "./incentive.types";

const incentiveTypeValues = Object.values(INCENTIVE_TYPE) as [
  string,
  ...string[],
];

const currentYear = new Date().getFullYear();

export const incentiveSchema = z.object({
  profile_id: z.string().uuid("Employee is required."),

  incentive_type: z.enum(incentiveTypeValues),

  title: z
    .string()
    .trim()
    .min(3, "Title is required.")
    .max(120, "Title cannot exceed 120 characters."),

  description: z
    .string()
    .trim()
    .min(5, "Description is required.")
    .max(1000, "Description cannot exceed 1000 characters."),

  amount: z.coerce
    .number({
      error: "Amount is required.",
    })
    .positive("Amount must be greater than 0."),

  month: z.coerce
    .number({
      error: "Month is required.",
    })
    .int("Month is invalid.")
    .min(1, "Month is invalid.")
    .max(12, "Month is invalid."),

  year: z.coerce
    .number({
      error: "Year is required.",
    })
    .int("Year is invalid.")
    .min(2000, "Year is invalid.")
    .max(currentYear + 1, "Year is invalid."),
});

export const updateIncentiveSchema = incentiveSchema.partial();

export const incentiveIdSchema = z.object({
  incentiveId: z.string().uuid("Invalid incentive."),
});

export const reviewIncentiveSchema = incentiveIdSchema.extend({
  status: z.enum([
    INCENTIVE_STATUS.APPROVED,
    INCENTIVE_STATUS.REJECTED,
  ]),
});

export type IncentiveInput = z.infer<typeof incentiveSchema>;
export type UpdateIncentiveInput =
  z.infer<typeof updateIncentiveSchema>;
export type ReviewIncentiveInput =
  z.infer<typeof reviewIncentiveSchema>;
