import { z } from "zod";

import {
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_TYPE,
  TARGET_AUDIENCE,
} from "./announcement.types";

const announcementBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message cannot exceed 5000 characters."),

  announcement_type: z.enum([
    ANNOUNCEMENT_TYPE.GENERAL,
  
    ANNOUNCEMENT_TYPE.HOLIDAY,
    ANNOUNCEMENT_TYPE.EVENT,
    ANNOUNCEMENT_TYPE.MEETING,
    ANNOUNCEMENT_TYPE.POLICY,
    ANNOUNCEMENT_TYPE.EMERGENCY,
  ]),

  target_audience: z.enum([
    TARGET_AUDIENCE.EVERYONE,
    TARGET_AUDIENCE.ADMIN,
    TARGET_AUDIENCE.EMPLOYEE,
    TARGET_AUDIENCE.DEPARTMENT,
  ]),

  department: z.string().optional(),

  attachment_url: z.string().url().optional().or(z.literal("")),

  status: z.enum([
    ANNOUNCEMENT_STATUS.DRAFT,
    ANNOUNCEMENT_STATUS.PUBLISHED,
    ANNOUNCEMENT_STATUS.ARCHIVED,
  ]),

  is_pinned: z.boolean(),

  publish_at: z.string().optional(),

  expires_at: z.string().optional(),
});

export const announcementSchema = announcementBaseSchema.superRefine(
  (data, ctx) => {
    if (
      data.target_audience === TARGET_AUDIENCE.DEPARTMENT &&
      !data.department?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["department"],
        message: "Department is required.",
      });
    }
  }
);

export const updateAnnouncementSchema =
  announcementBaseSchema.partial();

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export type UpdateAnnouncementInput = z.infer<
  typeof updateAnnouncementSchema
>;