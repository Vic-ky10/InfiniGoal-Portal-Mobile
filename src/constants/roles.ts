export const ROLES = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];