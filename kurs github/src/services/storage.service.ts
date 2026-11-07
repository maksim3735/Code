

import type { Game, ActiveSession } from "../types/game.types";

const GAMES_STORAGE_KEY = "game_tracker_games";
const ACTIVE_SESSION_STORAGE_KEY = "game_tracker_active_session";


export function loadGames(): Game[] {
  try {
    const rawData = localStorage.getItem(GAMES_STORAGE_KEY);
    if (!rawData) {
      return [];
    }
    return JSON.parse(rawData) as Game[];
  } catch (error) {
    console.error("Помилка при зчитуванні списку ігор зі сховища:", error);
    return [];
  }
}


export function saveGames(games: Game[]): void {
  try {
    const rawData = JSON.stringify(games);
    localStorage.setItem(GAMES_STORAGE_KEY, rawData);
  } catch (error) {
    console.error("Помилка при збереженні списку ігор у сховище:", error);
  }
}


export function loadActiveSession(): ActiveSession | null {
  try {
    const rawData = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!rawData) {
      return null;
    }
    return JSON.parse(rawData) as ActiveSession;
  } catch (error) {
    console.error("Помилка при зчитуванні активної сесії:", error);
    return null;
  }
}


export function saveActiveSession(session: ActiveSession): void {
  try {
    const rawData = JSON.stringify(session);
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, rawData);
  } catch (error) {
    console.error("Помилка при збереженні активної сесії:", error);
  }
}


export function clearActiveSession(): void {
  localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
}

