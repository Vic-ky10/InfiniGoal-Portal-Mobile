import { LEAVE_DURATION } from "./leave.types";

export function calculateLeaveDays({
  leave_duration,
  start_date,
  end_date,
}: {
  leave_duration: string;
  start_date: string;
  end_date: string;
}) {
  if (!start_date || !end_date || end_date < start_date) {
    return 0;
  }

  if (leave_duration === LEAVE_DURATION.HALF_DAY) {
    return 0.5;
  }

  const start = new Date(`${start_date}T00:00:00`);
  const end = new Date(`${end_date}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  return Math.floor(diff / 86_400_000) + 1;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
