

import type { Game } from "../types/game.types";


export function calculateNewRating(
  currentRating: number | null,
  sessionCount: number,
  newScore: number
): number {
  if (currentRating === null || sessionCount === 0) {
    return Math.round(newScore * 10) / 10;
  }

  const updatedRating = (currentRating * sessionCount + newScore) / (sessionCount + 1);
  return Math.round(updatedRating * 10) / 10;
}


export function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return "0 хв";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} хв`;
  }

  if (remainingMinutes === 0) {
    return `${hours} год`;
  }

  return `${hours} год ${remainingMinutes} хв`;
}


export function isGameActual(lastSessionDate: string | null): boolean {
  if (!lastSessionDate) {
    return false;
  }

  const sessionDate = new Date(lastSessionDate);
  if (isNaN(sessionDate.getTime())) {
    return false;
  }

  const now = new Date();
  const diffTimeMs = now.getTime() - sessionDate.getTime();
  const diffDays = diffTimeMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 7;
}


export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateToDisplay(dateStr: string | null): string {
  if (!dateStr) {
    return "-";
  }

  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = cleanDate.split("-");

  if (parts.length !== 3) {
    return dateStr;
  }

  const [year, month, day] = parts;
  return `${day}.${month}.${year}`;
}


export function getTopGamesData(games: Game[]): { labels: string[]; data: number[] } {
  if (games.length === 0) {
    return { labels: [], data: [] };
  }

  const sorted = [...games].sort((a, b) => b.totalTime - a.totalTime);

  if (sorted.length <= 5) {
    return {
      labels: sorted.map((g) => g.name),
      data: sorted.map((g) => g.totalTime),
    };
  }

  const top5 = sorted.slice(0, 5);
  const other = sorted.slice(5);
  const otherTotalTime = other.reduce((s, g) => s + g.totalTime, 0);

  return {
    labels: [...top5.map((g) => g.name), "Інші"],
    data: [...top5.map((g) => g.totalTime), otherTotalTime],
  };
}
