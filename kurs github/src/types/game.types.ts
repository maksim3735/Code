

export interface Game {
  id: string;                         // ID гри
  name: string;                       // Назва гри
  imageUrl: string;                   // посилання на постер
  totalTime: number;                  // Загальний награний (хв)
  startDate: string;                  // Дата початку гри
  rating: number | null;              // Оцінка
  sessionCount: number;               // Кількість зіграних сесій
  lastSessionDate: string | null;     // Дата останнього сеансу
  lastSessionTime: number;            // Тривалість останнього сеансу
  favorite: boolean;                  // Улюблена гра (y/n)
}

export interface ActiveSession {
  gameId: string;                     // ID гри, у яку зараз грає користувач
  startTime: number;                  // Час початку сесії
  pauseStartTime: number | null;      // Коли натиснули паузу 
  allPauseTime: number;               // Час паузи 
  paused: boolean;                    // Пауза чи ні
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export interface GameFormData {
  name: string;
  imageUrl: string;
  totalHours: number;
  totalMinutes: number;
  startDate: string;
  rating: number | null;
  sessionCount: number;
}

export type LibraryFilter = "all" | "favorites" | "actual";

export type SortDirection = "up" | "down";

export type LibrarySort = "name" | "lastSessionDate" | "createdAt";

export type TableSort = 
  | "name" 
  | "totalTime" 
  | "startDate" 
  | "rating" 
  | "sessionCount" 
  | "lastSessionDate" 
  | "lastSessionTime";