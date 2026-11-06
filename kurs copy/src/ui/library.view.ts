

import type { Game, LibraryFilter, LibrarySort } from "../types/game.types";
import { formatMinutes, formatDateToDisplay, isGameActual } from "../utils/calculations";

import defaultPosterImg from "../assets/void.jpg"; 

const DEFAULT_POSTER = defaultPosterImg;

export function filterAndSortGames(
  games: Game[],
  search: string,
  filterType: LibraryFilter, 
  sortBy: LibrarySort
): Game[] {


  let result = [...games];


  const slovo = search.trim().toLowerCase();
  if (slovo.length > 0) {
    result = result.filter((g) => g.name.toLowerCase().includes(slovo));
  }

  
  if (filterType === "favorites") {
    result = result.filter((g) => g.favorite);
  } else if (filterType === "actual") {
    result = result.filter((g) => isGameActual(g.lastSessionDate));
  }


  if (sortBy === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name, "uk"));
  } else if (sortBy === "lastSessionDate") {
    result.sort((a, b) => {
      const timeA = a.lastSessionDate ? new Date(a.lastSessionDate).getTime() : 0;
      const timeB = b.lastSessionDate ? new Date(b.lastSessionDate).getTime() : 0;
      return timeB - timeA;
    });
  } else if (sortBy === "createdAt") {
    result.sort((a, b) => b.id.localeCompare(a.id));
  }

  return result;
}


export function renderGameCards(
  games: Game[],
  container: HTMLElement,
  emptyMessageEl: HTMLElement,
  callbacks: {
    onToggleFavorite: (id: string) => void;
    onEdit: (game: Game) => void;
    onDelete: (id: string) => void;
  }
): void {
  container.innerHTML = "";

  if (games.length === 0) {
    emptyMessageEl.classList.remove("hidden");
    return;
  }

  emptyMessageEl.classList.add("hidden");

  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "game-card";

    const posterUrl = game.imageUrl && game.imageUrl.trim().length > 0 
      ? game.imageUrl : DEFAULT_POSTER;

    const ratingText = game.rating !== null ? `★ ${game.rating}` : "Без оцінки";
    const lastPlayedText = formatDateToDisplay(game.lastSessionDate);

    card.innerHTML = `
      <div class="card-poster-wrapper">
        <img 
          src="${posterUrl}" 
          alt="${game.name}" 
          class="card-poster"
          onerror="this.src='${DEFAULT_POSTER}'"
        />
        <button 
          class="btn-favorite ${game.favorite ? "active" : ""}" 
          title="${game.favorite ? "Видалити з улюблених" : "Додати в улюблені"}"
        >
          ${game.favorite ? "❤️" : "🤍"}
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title" title="${game.name}">${game.name}</h3>
        <div class="card-meta">
          <span>Час: <strong>${formatMinutes(game.totalTime)}</strong></span>
          <span>Оцінка: <strong>${ratingText}</strong></span>
        </div>
        <div class="card-meta">
          <span>Остання гра: <strong>${lastPlayedText}</strong></span>
          <span>Сесій: <strong>${game.sessionCount}</strong></span>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary btn-edit">Редагувати</button>
          <button class="btn btn-danger btn-delete">Видалити</button>
        </div>
      </div>
    `;

    const btnFav = card.querySelector(".btn-favorite") as HTMLButtonElement;
    btnFav.addEventListener("click", () => callbacks.onToggleFavorite(game.id));

    const btnEdit = card.querySelector(".btn-edit") as HTMLButtonElement;
    btnEdit.addEventListener("click", () => callbacks.onEdit(game));

    const btnDelete = card.querySelector(".btn-delete") as HTMLButtonElement;
    btnDelete.addEventListener("click", () => callbacks.onDelete(game.id));

    container.appendChild(card);
  });
}