

import type { ValidationResult, GameFormData } from "../types/game.types";


export function validateGameForm(data: GameFormData): ValidationResult {
  const errors: Record<string, string> = {};

  const trimName = data.name.trim();
  if (!trimName) {
    errors["name"] = "Назва гри є обов'язковою для заповнення.";
  } else if (trimName.length < 2) {
    errors["name"] = "Назва повинна містити мінімум 2 символи.";
  } else if (trimName.length > 60) {
    errors["name"] = "Назва не може перевищувати 60 символів.";
  }


  const trimmedUrl = data.imageUrl.trim();
  if (trimmedUrl.length > 0) {
    const isUrl = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
    if (!isUrl) {
      errors["imageUrl"] = "Введіть коректне посилання, що починається з http:// або https://";
    }
  }


  if (isNaN(data.totalHours) || data.totalHours < 0) {
    errors["totalHours"] = "Кількість годин не може бути від'ємною.";
  }

  if (isNaN(data.totalMinutes) || data.totalMinutes < 0 || data.totalMinutes > 59) {
    errors["totalMinutes"] = "Хвилини повинні бути в діапазоні від 0 до 59.";
  }


  if (data.rating !== null) {
    if (isNaN(data.rating) || data.rating < 1 || data.rating > 10) {
      errors["rating"] = "Оцінка повинна бути числом від 1 до 10.";
    }
  }


  if (isNaN(data.sessionCount) || data.sessionCount < 0) {
    errors["sessionCount"] = "Кількість сесій не може бути меншою за 0.";
  }


if (data.startDate) {
    const inputDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const minDate = new Date("1970-01-01");

    if (isNaN(inputDate.getTime())) {
      errors["startDate"] = "Некоректний формат дати.";
    } else if (inputDate > today) {
      errors["startDate"] = "Дата початку гри не може бути пізнішою за сьогоднішню.";
    } else if (inputDate < minDate) {
      errors["startDate"] = "Дата початку гри не може бути ранішою за 01.01.1970.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}