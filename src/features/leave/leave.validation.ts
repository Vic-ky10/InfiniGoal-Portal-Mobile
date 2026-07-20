import { z } from "zod";

import {
  HALF_DAY_SESSION,
  LEAVE_DURATION,
  LEAVE_STATUS,
  LEAVE_TYPE,
} from "./leave.types";
import { calculateLeaveDays } from "./leave.utils";

const leaveTypeValues = Object.values(LEAVE_TYPE) as [string, ...string[]];
const durationValues = Object.values(LEAVE_DURATION) as [
  string,
  ...string[],
];
const sessionValues = Object.values(HALF_DAY_SESSION) as [
  string,
  ...string[],
];
const statusValues = Object.values(LEAVE_STATUS) as [string, ...string[]];

export const leaveRequestSchema = z
  .object({
    leave_type: z.enum(leaveTypeValues, {
      error: "Select a valid leave type.",
    }),
    leave_duration: z.enum(durationValues, {
      error: "Select a valid leave duration.",
    }),
    half_day_session: z.enum(sessionValues).or(z.literal("")).optional(),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    reason: z
      .string()
      .trim()
      .min(10, "Reason must be at least 10 characters.")
      .max(500, "Reason must be at most 500 characters."),
  })
  .superRefine((value, ctx) => {
    if (value.end_date < value.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "End date must be on or after start date.",
      });
    }

    if (
      value.leave_duration === LEAVE_DURATION.HALF_DAY &&
      !value.half_day_session
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["half_day_session"],
        message: "Select a half day session.",
      });
    }

    if (
      value.leave_duration === LEAVE_DURATION.HALF_DAY &&
      value.start_date !== value.end_date
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "Half day leave must start and end on the same date.",
      });
    }

    if (calculateLeaveDays(value) <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["start_date"],
        message: "Leave dates are invalid.",
      });
    }
  });

export const leaveFiltersSchema = z.object({
  profileId: z.string().trim().optional(),
  status: z.enum(statusValues).or(z.literal("")).optional(),
});

export const reviewLeaveSchema = z.object({
  leaveRequestId: z.string().uuid("Invalid leave request."),
  status: z.enum([LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED]),
  review_comment: z
    .string()
    .trim()
    .max(500, "Review comment must be at most 500 characters.")
    .optional(),
});

export const cancelLeaveSchema = z.object({
  leaveRequestId: z.string().uuid("Invalid leave request."),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type LeaveFiltersInput = z.infer<typeof leaveFiltersSchema>;
export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;
