

import type { 
  Game, 
  ActiveSession, 
  LibraryFilter, 
  LibrarySort, 
  TableSort, 
  SortDirection,
  GameFormData 
} from "./types/game.types";

import { 
  loadGames, 
  saveGames, 
  loadActiveSession, 
  saveActiveSession, 
  clearActiveSession 
} from "./services/storage.service";

import { 
  calculateNewRating, 
  getTodayDateString, 
  formatMinutes 
} from "./utils/calculations";

import { validateGameForm } from "./utils/validation";

import { filterAndSortGames, renderGameCards } from "./ui/library.view";
import { sortTableGames, renderTable, updateSortIcons } from "./ui/table.view";
import { updateStatsSummary, renderTimeChart, renderSessionsChart } from "./ui/charts.view";
import { 
  formatTimerDisplay, 
  getSessionSeconds, 
  getSessionMinutes, 
  gameSelectList, 
  updateSessionUI 
} from "./ui/session.view";


let games: Game[] = loadGames();
let activeSession: ActiveSession | null = loadActiveSession();
let timerInterval: number | null = null;

let librarySearch = "";
let libraryFilter: LibraryFilter = "all";
let librarySort: LibrarySort = "name";
let visibleGamesCount = 8;
let gameIdPendingDelete: string | null = null; 

let tableSortField: TableSort = "name";
let tableSortDirection: SortDirection = "up";
let tableCurrentPage = 1;



// Сесія
const btnStartSessionView = document.getElementById("btn-start-session-view") as HTMLButtonElement;
const sessionPanel = document.getElementById("session-panel") as HTMLElement;
const sessionNoGames = document.getElementById("session-no-games") as HTMLElement;
const btnCancelSessionInit = document.getElementById("btn-cancel-session-init") as HTMLButtonElement;
const sessionSelectBlock = document.getElementById("session-select-block") as HTMLElement;
const sessionGameSelect = document.getElementById("session-game-select") as HTMLSelectElement;
const btnConfirmStart = document.getElementById("btn-confirm-start") as HTMLButtonElement;
const btnCancelStart = document.getElementById("btn-cancel-start") as HTMLButtonElement;
const sessionActiveBlock = document.getElementById("session-active-block") as HTMLElement;
const activeGameTitle = document.getElementById("active-game-title") as HTMLElement;
const sessionTimerText = document.getElementById("session-timer-text") as HTMLElement;
const sessionStatusText = document.getElementById("session-status-text") as HTMLElement;
const btnPauseSession = document.getElementById("btn-pause-session") as HTMLButtonElement;
const btnStopSession = document.getElementById("btn-stop-session") as HTMLButtonElement;
const errSessionGame = document.getElementById("err-session-game") as HTMLElement;

// Бібліотека
const btnOpenAddModal = document.getElementById("btn-open-add-modal") as HTMLButtonElement;
const btnLoadMore = document.getElementById("btn-load-more") as HTMLButtonElement;
const librarySearchInput = document.getElementById("library-search-input") as HTMLInputElement;
const libraryFilterSelect = document.getElementById("library-filter-select") as HTMLSelectElement;
const librarySortSelect = document.getElementById("library-sort-select") as HTMLSelectElement;
const gamesGrid = document.getElementById("games-grid") as HTMLElement;
const libraryEmptyMsg = document.getElementById("library-empty-msg") as HTMLElement;

// Таблиця
const tableBody = document.getElementById("table-body") as HTMLElement;
const tableHeaderCells = document.querySelectorAll(".data-table th") as NodeListOf<HTMLTableCellElement>;
const btnPrevPage = document.getElementById("btn-prev-page") as HTMLButtonElement;
const btnNextPage = document.getElementById("btn-next-page") as HTMLButtonElement;
const paginationInfo = document.getElementById("pagination-info") as HTMLElement;

// Статистика
const statTotalTime = document.getElementById("stat-total-time") as HTMLElement;
const statGamesCount = document.getElementById("stat-games-count") as HTMLElement;
const statSessionsCount = document.getElementById("stat-sessions-count") as HTMLElement;
const timeChartCanvas = document.getElementById("timeDistributionChart") as HTMLCanvasElement;
const sessionsChartCanvas = document.getElementById("sessionsCountChart") as HTMLCanvasElement;

// Модалка гри
const gameModal = document.getElementById("game-modal") as HTMLElement;
const modalTitle = document.getElementById("modal-title") as HTMLElement;
const btnCloseModal = document.getElementById("btn-close-modal") as HTMLButtonElement;
const btnCancelGameForm = document.getElementById("btn-cancel-game-form") as HTMLButtonElement;
const gameForm = document.getElementById("game-form") as HTMLFormElement;

const formGameId = document.getElementById("form-game-id") as HTMLInputElement;
const formGameName = document.getElementById("form-game-name") as HTMLInputElement;
const formGameImage = document.getElementById("form-game-image") as HTMLInputElement;
const formTotalHours = document.getElementById("form-total-hours") as HTMLInputElement;
const formTotalMinutes = document.getElementById("form-total-minutes") as HTMLInputElement;
const formStartDate = document.getElementById("form-start-date") as HTMLInputElement;
const formGameRating = document.getElementById("form-game-rating") as HTMLInputElement;
const formSessionCount = document.getElementById("form-session-count") as HTMLInputElement;

// Модалка оцінки сесії
const ratingModal = document.getElementById("rating-modal") as HTMLElement;
const ratingSummaryText = document.getElementById("rating-summary-text") as HTMLElement;
const sessionUserRating = document.getElementById("session-user-rating") as HTMLInputElement;
const btnSaveSessionRating = document.getElementById("btn-save-session-rating") as HTMLButtonElement;

const deleteModal = document.getElementById("delete-modal") as HTMLElement;
const deleteModalText = document.getElementById("delete-modal-text") as HTMLElement;
const btnCancelDelete = document.getElementById("btn-cancel-delete") as HTMLButtonElement;
const btnConfirmDelete = document.getElementById("btn-confirm-delete") as HTMLButtonElement;



// Оновлення UI

function refreshLibrary(): void {
  const filtered = filterAndSortGames(games, librarySearch, libraryFilter, librarySort);

  const visibleSubset = filtered.slice(0, visibleGamesCount);

  renderGameCards(visibleSubset, gamesGrid, libraryEmptyMsg, {
    onToggleFavorite: handleToggleFavorite,
    onEdit: handleOpenEditModal,
    onDelete: handleOpenDeleteModal, 
  });

  if (filtered.length > visibleGamesCount) {
    btnLoadMore.classList.remove("hidden");
  } else {
    btnLoadMore.classList.add("hidden");
  }
}

function refreshTable(): void {
  const maxPages = Math.ceil(games.length / 10) || 1;
  if (tableCurrentPage > maxPages) {
    tableCurrentPage = maxPages;
  } else if (tableCurrentPage < 1) {
    tableCurrentPage = 1;
  }

  const sorted = sortTableGames(games, tableSortField, tableSortDirection);
  renderTable(sorted, tableCurrentPage, tableBody, paginationInfo, btnPrevPage, btnNextPage);
  updateSortIcons(tableHeaderCells, tableSortField, tableSortDirection);
}

function refreshStats(): void {
  updateStatsSummary(games, statTotalTime, statGamesCount, statSessionsCount);
  renderTimeChart(timeChartCanvas, games);
  renderSessionsChart(sessionsChartCanvas, games);
}

function refreshSessionUI(): void {
  gameSelectList(sessionGameSelect, games);
  updateSessionUI(activeSession, games, {
    panel: sessionPanel,
    noGamesBlock: sessionNoGames,
    selectBlock: sessionSelectBlock,
    activeBlock: sessionActiveBlock,
    timerText: sessionTimerText,
    statusText: sessionStatusText,
    btnPause: btnPauseSession,
    gameTitle: activeGameTitle,
  });
}

function refreshAll(): void {
  refreshLibrary();
  refreshTable();
  refreshStats();
  refreshSessionUI();
}


// Таймер сесії

function startTimerTicker(): void {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = window.setInterval(() => {
    if (!activeSession) return;
    const seconds = getSessionSeconds(activeSession);
    sessionTimerText.textContent = formatTimerDisplay(seconds);
  }, 
  1000);
}

function stopTimerTicker(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}


// події сесії

sessionGameSelect.addEventListener("change", () => {
  if (errSessionGame) {
    errSessionGame.textContent = "";
  }
});

btnStartSessionView.addEventListener("click", () => {
  btnStartSessionView.classList.add("hidden");
  sessionPanel.classList.remove("hidden");
  refreshSessionUI();
});

btnCancelSessionInit.addEventListener("click", () => {
  sessionPanel.classList.add("hidden");
  btnStartSessionView.classList.remove("hidden");
});

btnCancelStart.addEventListener("click", () => {
  if (errSessionGame) errSessionGame.textContent = "";
  sessionPanel.classList.add("hidden");
  btnStartSessionView.classList.remove("hidden");
});

btnConfirmStart.addEventListener("click", () => {
  const selectedId = sessionGameSelect.value;

  if (!selectedId) {
    errSessionGame.textContent = "Будь ласка, оберіть гру зі списку перед початком!";
    return;
  }

  errSessionGame.textContent = "";

  activeSession = {
    gameId: selectedId,
    startTime: Date.now(),
    pauseStartTime: null,
    allPauseTime: 0,
    paused: false,
  };

  saveActiveSession(activeSession);
  refreshSessionUI();
  startTimerTicker();
});

btnPauseSession.addEventListener("click", () => {
  if (!activeSession) return;

  if (!activeSession.paused) {
    activeSession.paused = true;
    activeSession.pauseStartTime = Date.now();
  } else {
    activeSession.paused = false;
    if (activeSession.pauseStartTime) {
      activeSession.allPauseTime += Date.now() - activeSession.pauseStartTime;
      activeSession.pauseStartTime = null;
    }
  }

  saveActiveSession(activeSession);
  refreshSessionUI();
});

btnStopSession.addEventListener("click", () => {
  if (!activeSession) return;

  const durationMin = getSessionMinutes(activeSession);
  ratingSummaryText.textContent = `Сесія тривала ${formatMinutes(durationMin)}. Як ви оцінюєте поточний сеанс?`;
  sessionUserRating.value = "";
  ratingModal.classList.remove("hidden");
});

btnSaveSessionRating.addEventListener("click", () => {
  if (!activeSession) return;

  const durationMin = getSessionMinutes(activeSession);
  const score = Math.max(1, Math.min(10, Number(sessionUserRating.value) || 7));

  games = games.map((g) => {
    if (g.id !== activeSession?.gameId) return g;

    const newRating = calculateNewRating(g.rating, g.sessionCount, score); 
    return {
      ...g,  // спред, щоб не писати всі поля 
      totalTime: Math.round(g.totalTime + durationMin),
      sessionCount: g.sessionCount + 1,
      rating: newRating,
      lastSessionDate: new Date().toISOString(),
      lastSessionTime: durationMin,
    };
  });

  saveGames(games);
  clearActiveSession();
  activeSession = null;
  stopTimerTicker();

  ratingModal.classList.add("hidden");
  sessionPanel.classList.add("hidden");
  btnStartSessionView.classList.remove("hidden");

  refreshAll();
});


// бібліотека

function handleToggleFavorite(id: string): void {
  games = games.map((g) => (g.id === id ? { ...g, favorite: !g.favorite } : g)); 
  saveGames(games); 
  refreshLibrary();
}

function handleOpenDeleteModal(id: string): void {
  const targetGame = games.find((g) => g.id === id);
  if (!targetGame) return;

  gameIdPendingDelete = id;
  deleteModalText.textContent = `Ви дійсно бажаєте видалити гру "${targetGame.name}"?`;
  deleteModal.classList.remove("hidden");
}

btnCancelDelete.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
  gameIdPendingDelete = null;
});

btnConfirmDelete.addEventListener("click", () => {
  if (!gameIdPendingDelete) return;

  const id = gameIdPendingDelete;
  games = games.filter((g) => g.id !== id);
  saveGames(games);

  if (activeSession && activeSession.gameId === id) {
    clearActiveSession();
    activeSession = null;
    stopTimerTicker();
  }

  deleteModal.classList.add("hidden");
  gameIdPendingDelete = null;

  refreshAll();
});

librarySearchInput.addEventListener("input", () => {
  librarySearch = librarySearchInput.value;
  visibleGamesCount = 8; 
  refreshLibrary();
});

libraryFilterSelect.addEventListener("change", () => {
  libraryFilter = libraryFilterSelect.value as LibraryFilter;
  visibleGamesCount = 8; 
  refreshLibrary();
});

librarySortSelect.addEventListener("change", () => {
  librarySort = librarySortSelect.value as LibrarySort;
  visibleGamesCount = 8; 
  refreshLibrary();
});

btnLoadMore.addEventListener("click", () => {
  visibleGamesCount += 8; 
  refreshLibrary();
});


// додавання та редагування гри

function clearFormErrors(): void {
  const errorElements = gameForm.querySelectorAll(".error-msg");
  errorElements.forEach((el) => (el.textContent = ""));
}

function openModal(title: string): void {
  modalTitle.textContent = title;
  clearFormErrors();
  gameModal.classList.remove("hidden");
}

function closeModal(): void {
  gameModal.classList.add("hidden");
  gameForm.reset();
}

btnOpenAddModal.addEventListener("click", () => {
  formGameId.value = "";
  gameForm.reset();
  formStartDate.value = getTodayDateString();
  openModal("Додати гру");
});

btnCloseModal.addEventListener("click", closeModal);
btnCancelGameForm.addEventListener("click", closeModal);

function handleOpenEditModal(game: Game): void {
  formGameId.value = game.id;
  formGameName.value = game.name;
  formGameImage.value = game.imageUrl;
  formTotalHours.value = Math.floor(game.totalTime / 60).toString();
  formTotalMinutes.value = (game.totalTime % 60).toString();
  formStartDate.value = game.startDate || getTodayDateString();
  formGameRating.value = game.rating !== null ? game.rating.toString() : "";
  formSessionCount.value = game.sessionCount.toString();

  openModal("Редагувати гру");
}

// форма гри
gameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearFormErrors();

  const rawRating = formGameRating.value.trim();
  const formData: GameFormData = {
    name: formGameName.value,
    imageUrl: formGameImage.value,
    totalHours: Number(formTotalHours.value) || 0,
    totalMinutes: Number(formTotalMinutes.value) || 0,
    startDate: formStartDate.value,
    rating: rawRating !== "" ? Number(rawRating) : null,
    sessionCount: Number(formSessionCount.value) || 0,
  };

  const validation = validateGameForm(formData);

  if (!validation.isValid) {
    Object.keys(validation.errors).forEach((key) => {
      const errEl = document.getElementById(`err-${key}`);
      if (errEl) errEl.textContent = validation.errors[key];
    });
    return;
  }

  const calculatedTotalMinutes = Math.round(formData.totalHours * 60 + formData.totalMinutes);
  const isEditing = Boolean(formGameId.value);

  if (isEditing) {
    games = games.map((g) => {
      if (g.id !== formGameId.value) return g;
      return {
        ...g,
        name: formData.name.trim(),
        imageUrl: formData.imageUrl.trim(),
        totalTime: calculatedTotalMinutes,
        startDate: formData.startDate,
        rating: formData.rating,
        sessionCount: formData.sessionCount,
      };
    });
  } else {
    const newGame: Game = {
      id: "game_" + Date.now().toString(),
      name: formData.name.trim(),
      imageUrl: formData.imageUrl.trim(),
      totalTime: calculatedTotalMinutes,
      startDate: formData.startDate || getTodayDateString(),
      rating: formData.rating,
      sessionCount: formData.sessionCount,
      lastSessionDate: null,
      lastSessionTime: 0,
      favorite: false,
    };
    games.push(newGame);
  }

  saveGames(games);
  closeModal();
  refreshAll();
});


// таблиця

tableHeaderCells.forEach((th) => {
  th.addEventListener("click", () => {
    const sortKey = th.dataset.sort as TableSort | undefined;
    if (!sortKey) return;

    if (tableSortField === sortKey) {
      tableSortDirection = tableSortDirection === "up" ? "down" : "up";
    } else {
      tableSortField = sortKey;
      tableSortDirection = "up";
    }

    refreshTable();
  });
});

btnPrevPage.addEventListener("click", () => {
  if (tableCurrentPage > 1) {
    tableCurrentPage--;
    refreshTable();
  }
});

btnNextPage.addEventListener("click", () => {
  const maxPages = Math.ceil(games.length / 10) || 1;
  if (tableCurrentPage < maxPages) {
    tableCurrentPage++;
    refreshTable();
  }
});



// ЗАПУСК

function init(): void {
  refreshAll();

  if (activeSession) {
    btnStartSessionView.classList.add("hidden");
    sessionPanel.classList.remove("hidden");
    startTimerTicker();
  }
}

init();