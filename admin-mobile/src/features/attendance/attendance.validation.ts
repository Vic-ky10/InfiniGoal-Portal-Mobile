import { z } from "zod";

import { ATTENDANCE_STATUS } from "./attendance.types";

const statusValues = Object.values(ATTENDANCE_STATUS) as [
  string,
  ...string[],
];

export const attendanceNotesSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(300, "Notes must be at most 300 characters.")
    .optional(),
});

export const attendanceFiltersSchema = z.object({
  profileId: z.string().trim().optional(),
  date: z.string().trim().optional(),
  status: z.enum(statusValues).or(z.literal("")).optional(),
  search: z.string().trim().optional(),
});

export type AttendanceNotesInput = z.infer<
  typeof attendanceNotesSchema
>;

export type AttendanceFiltersInput = z.infer<
  typeof attendanceFiltersSchema
>;
