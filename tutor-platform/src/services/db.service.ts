

import type {
  DatabaseState,
  TutorFormData,
  StudentFormData,
  LessonFormData,
} from "../types/tutor.types";

const API_URL = "http://localhost:3000/api";

//отримання
export async function fetchDatabaseState(): Promise<DatabaseState> { 
  const response = await fetch(`${API_URL}/data`);
  if (!response.ok) {
    throw new Error("Не вдалося отримати дані");
  }
  return (await response.json()) as DatabaseState;
}

//створення 
export async function createTutorInDb(data: TutorFormData): Promise<{ ok: boolean; error?: string }> { 
  const response = await fetch(`${API_URL}/tutors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

//оновлення
export async function updateTutorInDb(tutorId: number, data: TutorFormData): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/tutors/${tutorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

//видалення
export async function deleteTutorFromDb(tutorId: number): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/tutors/${tutorId}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function createStudentInDb(data: StudentFormData): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

export async function deleteStudentFromDb(studentId: number): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/students/${studentId}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function createLessonWithHomeworkInDb(
  data: LessonFormData
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await response.json();
}

export async function updateLessonStatusInDb(
  lessonId: number,
  status: "COMPLETED" | "CANCELLED"
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/lessons/${lessonId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return await response.json();
}

export async function cleanupCancelledLessonsInDb(): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/lessons/cleanup`, {
    method: "DELETE",
  });
  return await response.json();
}