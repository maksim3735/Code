

import { Chart, registerables } from "chart.js";
import type { Game } from "../types/game.types";
import { getTopGamesData } from "../utils/calculations";

Chart.register(...registerables);

let timeChart: Chart | null = null;
let sessionsChart: Chart | null = null;


export function updateStatsSummary(
  games: Game[],
  totalTimeEl: HTMLElement,
  gamesCountEl: HTMLElement,
  sessionsCountEl: HTMLElement
): void {
  const totalMinutes = games.reduce((sum, g) => sum + g.totalTime, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalSessions = games.reduce((sum, g) => sum + g.sessionCount, 0);

  totalTimeEl.textContent = `${totalHours} год`;
  gamesCountEl.textContent = games.length.toString();
  sessionsCountEl.textContent = totalSessions.toString();
}


export function renderTimeChart(canvas: HTMLCanvasElement, games: Game[]): void {

  const { labels, data } = getTopGamesData(games);

  if (timeChart) {
    timeChart.destroy();
  }

  const hoursData = data.map((min) => Math.round((min / 60) * 10) / 10);
  timeChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: labels.length > 0 ? labels : ["Немає даних"],
      datasets: [
        {
          data: hoursData.length > 0 ? hoursData : [1],
          backgroundColor: [
            "#0609bd",
            "#ba29f4",
            "#ff0080",
            "#10b981",
            "#f59e0b",
            "#64748b",
          ],
          borderColor: "#11111c",
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
          labels: {
            color: "#94a3b8",
            font: { size: 12 },
            padding: 16,
          },
        },
      },
    },
  });
}


export function renderSessionsChart(canvas: HTMLCanvasElement, games: Game[]): void {

  if (sessionsChart) {
    sessionsChart.destroy();
  }

  const top10 = [...games]
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10);

  const labels = top10.map((g) => g.name);
  const data = top10.map((g) => g.sessionCount);

  sessionsChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels.length > 0 ? labels : ["Немає даних"],
      datasets: [
        {
          label: "Кількість сесій",
          data: data.length > 0 ? data : [0],
          backgroundColor: "#0070f3",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, 
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#94a3b8",
            stepSize: 1,
          },
          grid: { color: "#2b2f45" },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}