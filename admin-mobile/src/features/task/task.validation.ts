import { z } from "zod";

import {
  TASK_PRIORITY,
  TASK_STATUS,
} from "./task.types";

export const taskSchema = z.object({
  project_id: z.string().uuid("Please select a project."),

  project_member_id: z
    .string()
    .uuid("Please select an employee."),

  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  description: z.string().trim().optional(),

  priority: z.enum([
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.MEDIUM,
    TASK_PRIORITY.HIGH,
    TASK_PRIORITY.URGENT,
  ]),

  status: z.enum([
    TASK_STATUS.TODO,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.COMPLETED,
  ]),

  estimated_hours: z.coerce
    .number()
    .min(0)
    .nullable()
    .optional(),

  actual_hours: z.coerce
    .number()
    .min(0)
    .nullable()
    .optional(),

  due_date: z.string().min(1, "Due date is required."),
});

export const updateTaskSchema = taskSchema.partial();

export type TaskInput = z.infer<typeof taskSchema>;

export type UpdateTaskInput = z.infer<
  typeof updateTaskSchema
>;