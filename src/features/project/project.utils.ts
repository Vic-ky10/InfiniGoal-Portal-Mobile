import {
  PROJECT_PRIORITY,
  PROJECT_STATUS,
  ProjectPriority,
  ProjectStatus,
} from "./project.types";

export function formatProjectDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getProjectStatusTone(status: ProjectStatus) {
  if (status === PROJECT_STATUS.ACTIVE || status === PROJECT_STATUS.COMPLETED) {
    return "success" as const;
  }

  if (status === PROJECT_STATUS.PLANNING || status === PROJECT_STATUS.ON_HOLD) {
    return "warning" as const;
  }

  if (status === PROJECT_STATUS.CANCELLED) {
    return "danger" as const;
  }

  return "info" as const;
}

export function getProjectPriorityTone(priority: ProjectPriority) {
  if (priority === PROJECT_PRIORITY.HIGH) {
    return "danger" as const;
  }

  if (priority === PROJECT_PRIORITY.MEDIUM) {
    return "warning" as const;
  }

  return "info" as const;
}

export function calculateTimelineProgress({
  startDate,
  endDate,
  progress,
}: {
  startDate: string;
  endDate: string | null;
  progress: number;
}) {
  if (!endDate) {
    return progress;
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const today = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return progress;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(((today - start) / (end - start)) * 100))
  );
}
