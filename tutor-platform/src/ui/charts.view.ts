

import { Chart, registerables } from "chart.js";
import type { Tutor } from "../types/tutor.types";

Chart.register(...registerables);

let earningsChart: Chart | null = null;
let subjectsChart: Chart | null = null;

export function renderEarningsChart(canvas: HTMLCanvasElement, tutors: Tutor[]): void {
  if (earningsChart) {
    earningsChart.destroy();
  }

  const activeTutors = tutors.filter((t) => Number(t.totalEarnings) > 0);
  const labels = activeTutors.map((t) => `${t.firstName} ${t.lastName}`);
  const data = activeTutors.map((t) => Number(t.totalEarnings));

  earningsChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels.length > 0 ? labels : ["Немає оплачених занять"],
      datasets: [
        {
          label: "Дохід (грн)",
          data: data.length > 0 ? data : [0],
          backgroundColor: "#3b82f6",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: "#94a3b8" }, grid: { color: "#273043" } },
      },
    },
  });
}

export function renderSubjectsChart(
  canvas: HTMLCanvasElement,
  subjectStats: { subjectName: string; lessonsCount: number }[]
): void {
  if (subjectsChart) {
    subjectsChart.destroy();
  }

  const labels = subjectStats.map((s) => s.subjectName);
  const data = subjectStats.map((s) => Number(s.lessonsCount));

  subjectsChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels.length > 0 ? labels : ["Немає даних"],
      datasets: [
        {
          data: data.length > 0 ? data : [1],
          backgroundColor: ["#6366f1", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b", "#64748b"],
          borderColor: "#161b26",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#cbd5e1", padding: 14 },
        },
      },
    },
  });
}