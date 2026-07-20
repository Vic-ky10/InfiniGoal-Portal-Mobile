import { z } from "zod";

import {
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIORITY,
  PROJECT_STATUS,
} from "./project.types";

const priorityValues = Object.values(PROJECT_PRIORITY) as [
  string,
  ...string[],
];
const statusValues = Object.values(PROJECT_STATUS) as [string, ...string[]];
const memberRoleValues = Object.values(PROJECT_MEMBER_ROLE) as [
  string,
  ...string[],
];

export const projectSchema = z
  .object({
    project_code: z
      .string()
      .trim()
      .min(2, "Project code is required.")
      .max(40, "Project code must be at most 40 characters."),
    project_name: z
      .string()
      .trim()
      .min(2, "Project name is required.")
      .max(120, "Project name must be at most 120 characters."),
    description: z
      .string()
      .trim()
      .max(1000, "Description must be at most 1000 characters.")
      .optional(),
    department: z.string().trim().max(80).optional(),
    priority: z.enum(priorityValues, {
      error: "Select a valid priority.",
    }),
    status: z.enum(statusValues, {
      error: "Select a valid status.",
    }),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.end_date && value.end_date < value.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "End date must be on or after start date.",
      });
    }
  });

export const projectFiltersSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(statusValues).or(z.literal("")).optional(),
  priority: z.enum(priorityValues).or(z.literal("")).optional(),
});

export const projectIdSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
});

export const assignProjectMembersSchema = z.object({
  projectId: z.string().uuid("Invalid project."),
  profileIds: z
    .array(z.string().uuid("Invalid employee."))
    .min(1, "Select at least one employee."),
  member_role: z.enum(memberRoleValues, {
    error: "Select a valid member role.",
  }),
});

export const removeProjectMemberSchema = z.object({
  projectMemberId: z.string().uuid("Invalid project member."),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
export type AssignProjectMembersInput = z.infer<
  typeof assignProjectMembersSchema
>;
