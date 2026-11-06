

import type { Game, TableSort, SortDirection } from "../types/game.types";
import { formatMinutes, formatDateToDisplay } from "../utils/calculations";


export function sortTableGames(
  games: Game[],
  sortField: TableSort,
  direction: SortDirection
): Game[] {
  const result = [...games];

  result.sort((a, b) => {

    let x = 0;  // Значення для порівняння

    switch (sortField) {

      case "name":
        x = a.name.localeCompare(b.name, "uk");
        break;

      case "totalTime":
        x = a.totalTime - b.totalTime;
        break;

      case "startDate": {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        x = timeA - timeB;
        break;
      }

      case "rating": {
        const ratingA = a.rating ?? -1;
        const ratingB = b.rating ?? -1;
        x = ratingA - ratingB;
        break;
      }

      case "sessionCount":
        x = a.sessionCount - b.sessionCount;
        break;

      case "lastSessionDate": {
        const timeA = a.lastSessionDate ? new Date(a.lastSessionDate).getTime() : 0;
        const timeB = b.lastSessionDate ? new Date(b.lastSessionDate).getTime() : 0;
        x = timeA - timeB;
        break;
      }

      case "lastSessionTime":
        x = a.lastSessionTime - b.lastSessionTime;
        break;
    }

    return direction === "up" ? x : -x;
  });

  return result;
}


export function renderTable(
  games: Game[],
  currentPage: number,
  tbodyEl: HTMLElement,
  paginationInfoEl: HTMLElement,
  btnPrev: HTMLButtonElement,
  btnNext: HTMLButtonElement
): void {

  tbodyEl.innerHTML = "";

  const totalPages = Math.ceil(games.length / 10) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (safePage - 1) * 10;
  const pageGames = games.slice(startIndex, startIndex + 10);

  if (pageGames.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="7" class="empty-table-cell">Дані відсутні</td>`;
    tbodyEl.appendChild(emptyRow);
  } else {
    pageGames.forEach((game) => {
      const row = document.createElement("tr");

      const ratingDisplay = game.rating !== null ? `★ ${game.rating}` : "-";
      const startDateDisplay = formatDateToDisplay(game.startDate);
      const lastDateDisplay = formatDateToDisplay(game.lastSessionDate);
      const lastSessionDisplay = game.lastSessionTime > 0 ? formatMinutes(game.lastSessionTime) : "-";

      row.innerHTML = `
        <td><strong>${game.name}</strong></td>
        <td>${formatMinutes(game.totalTime)}</td>
        <td>${startDateDisplay}</td>
        <td>${ratingDisplay}</td>
        <td>${game.sessionCount}</td>
        <td>${lastDateDisplay}</td>
        <td>${lastSessionDisplay}</td>
      `;

      tbodyEl.appendChild(row);
    });
  }

  paginationInfoEl.textContent = `Сторінка ${safePage} з ${totalPages}`;
  btnPrev.disabled = safePage <= 1;
  btnNext.disabled = safePage >= totalPages;
}


export function updateSortIcons(
  headerCells: NodeListOf<HTMLTableCellElement>,
  currentSort: TableSort,
  currentDirection: SortDirection
): void {
  headerCells.forEach((th) => {
    const field = th.dataset.sort as TableSort | undefined;
    const iconSpan = th.querySelector(".sort-icon");

    if (!iconSpan) return;

    if (field === currentSort) {
      iconSpan.textContent = currentDirection === "up" ? " ▲" : " ▼";
    } else {
      iconSpan.textContent = "";
    }
  });
}