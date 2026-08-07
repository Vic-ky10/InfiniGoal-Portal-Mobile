import { z } from "zod";

import { EMPLOYEE_ROLE } from "./employee.constants";

const roleValues = Object.values(EMPLOYEE_ROLE) as [
  string,
  ...string[],
];

export const employeeSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters.")
    .max(50, "Name must be at most 50 characters.")
    .regex(
      /^[A-Za-z\s]+$/,
      "Name should contain only letters and spaces."
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address."),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone must contain exactly 10 digits."),

  department: z
    .string()
    .trim()
    .min(2, "Department is required."),

  designation: z
    .string()
    .trim()
    .min(2, "Designation is required.")
    .max(80, "Designation must be at most 80 characters."),

  role: z.enum(roleValues, {
    message: "Role is required.",
  }),

  date_of_birth: z.string().trim().nullable().optional(),
  current_address: z.string().trim().nullable().optional(),
  qualification: z.string().trim().nullable().optional(),
  degree: z.string().trim().nullable().optional(),
  experience_years: z.coerce.number().min(0, "Experience cannot be negative").nullable().optional(),
  emergency_contact: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone must contain exactly 10 digits.")
    .or(z.literal(""))
    .nullable()
    .optional(),
});

export type EmployeeFormData =
  z.infer<typeof employeeSchema>;

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters.")
    .max(50, "Name must be at most 50 characters.")
    .regex(
      /^[A-Za-z\s]+$/,
      "Name should contain only letters and spaces."
    ),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone must contain exactly 10 digits.")
    .or(z.literal(""))
    .nullable(),
  avatar_url: z.string().nullable().optional(),
  date_of_birth: z.string().trim().nullable().optional(),
  current_address: z.string().trim().nullable().optional(),
  qualification: z.string().trim().nullable().optional(),
  degree: z.string().trim().nullable().optional(),
  experience_years: z.coerce.number().min(0, "Experience cannot be negative").nullable().optional(),
  emergency_contact: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone must contain exactly 10 digits.")
    .or(z.literal(""))
    .nullable()
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
