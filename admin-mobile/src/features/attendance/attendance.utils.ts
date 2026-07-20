import { Attendance } from "./attendance.types";

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function calculateWorkingHours(
  loginTime: string,
  logoutTime: string
) {
  const login = new Date(loginTime).getTime();
  const logout = new Date(logoutTime).getTime();

  if (Number.isNaN(login) || Number.isNaN(logout) || logout <= login) {
    return 0;
  }

  return Number(((logout - login) / 36e5).toFixed(2));
}

export function isAlreadyLoggedIn(
  attendance: Attendance | null
) {
  return Boolean(attendance?.login_time);
}

export function isAlreadyLoggedOut(
  attendance: Attendance | null
) {
  return Boolean(attendance?.logout_time);
}

export function formatAttendanceTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatAttendanceDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatWorkingHours(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)} hrs`;
}
