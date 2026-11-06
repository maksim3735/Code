

import type { Game, ActiveSession } from "../types/game.types";


export function formatTimerDisplay(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");

  return `${h}:${m}:${s}`;
}


export function getSessionSeconds(session: ActiveSession): number {  //чиста тривалість сесії без урахування пауз
  const now = Date.now(); 
  let pauseTime = session.allPauseTime;

  if (session.paused && session.pauseStartTime) {
    pauseTime += now - session.pauseStartTime;
  }

  const timeMs = now - session.startTime - pauseTime;
  return Math.max(0, Math.floor(timeMs / 1000));
}


export function getSessionMinutes(session: ActiveSession): number {
  const seconds = getSessionSeconds(session);
  return Math.max(1, Math.round(seconds / 60));
}


export function gameSelectList(
  selectEl: HTMLSelectElement,
  games: Game[]
): void {
  selectEl.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Оберіть гру зі списку --";
  defaultOption.disabled = true; 
  defaultOption.selected = true; 
  selectEl.appendChild(defaultOption);

  games.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    selectEl.appendChild(opt);
  });
}


export function updateSessionUI(
  session: ActiveSession | null,
  games: Game[],
  elements: {
    panel: HTMLElement;
    noGamesBlock: HTMLElement;
    selectBlock: HTMLElement;
    activeBlock: HTMLElement;
    timerText: HTMLElement;
    statusText: HTMLElement;
    btnPause: HTMLButtonElement;
    gameTitle: HTMLElement;
  }
): void {

  if (!session) {
    elements.activeBlock.classList.add("hidden");

    if (games.length === 0) {
      elements.noGamesBlock.classList.remove("hidden");
      elements.selectBlock.classList.add("hidden");
    } else {
      elements.noGamesBlock.classList.add("hidden");
      elements.selectBlock.classList.remove("hidden");
    }
    return;
  }

  elements.noGamesBlock.classList.add("hidden");
  elements.selectBlock.classList.add("hidden");
  elements.activeBlock.classList.remove("hidden");

  const currentGame = games.find((g) => g.id === session.gameId);
  elements.gameTitle.textContent = currentGame ? currentGame.name : "Невідома гра";

  if (session.paused) {
    elements.statusText.textContent = "Сесія на паузі";
    elements.btnPause.textContent = "Продовжити";
    elements.btnPause.className = "btn btn-success";
  } else {
    elements.statusText.textContent = "Сесія триває...";
    elements.btnPause.textContent = "Призупинити";
    elements.btnPause.className = "btn btn-warning";
  }
}