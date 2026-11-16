

import type { ScheduleLesson } from "../types/tutor.types";

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const clean = dateStr.replace("T", " ").slice(0, 16);
  const [datePart, timePart] = clean.split(" ");
  if (!datePart) return clean;
  const parts = datePart.split("-");
  if (parts.length !== 3) return clean;
  return `${parts[2]}.${parts[1]}.${parts[0]} ${timePart || ""}`.trim();
}

export function isLessonActual(lesson: ScheduleLesson): boolean {
  if (lesson.lessonStatus === "SCHEDULED") {
    return true;
  }
  const lessonDate = new Date(lesson.scheduledTime);
  if (isNaN(lessonDate.getTime())) return true;

  const now = new Date();
  const diffDays = (now.getTime() - lessonDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 14;
}

export function translateStatus(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "Заплановано";
    case "COMPLETED":
      return "Проведено";
    case "CANCELLED":
      return "Скасовано";
    case "ONLINE":
      return "Онлайн";
    case "OFFLINE":
      return "Офлайн";
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: string): string {
  if (status === "COMPLETED" || status === "ONLINE") {
    return "badge badge-success";
  }
  if (status === "SCHEDULED") {
    return "badge badge-warning";
  }
  return "badge badge-danger";
}