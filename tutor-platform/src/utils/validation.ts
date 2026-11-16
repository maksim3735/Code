

import type {
  Tutor,
  Student,
  ScheduleLesson,
  TutorSubjectOption,
  TutorFormData,
  StudentFormData,
  LessonFormData,
  ValidationResult,
} from "../types/tutor.types";


export function validateTutorForm(
  data: TutorFormData,
  existingTutors: Tutor[],
  editingTutorId: number | null
): ValidationResult {
  const errors: { [key: string]: string } = {};

  if (data.firstName.trim().length < 2) {
    errors["tutorFirstName"] = "Ім'я повинно містити мінімум 2 символи.";
  }

  if (data.lastName.trim().length < 2) {
    errors["tutorLastName"] = "Прізвище повинно містити мінімум 2 символи.";
  }

  const emailClean = data.email.trim().toLowerCase();
  if (!emailClean.includes("@") || !emailClean.includes(".")) {
    errors["tutorEmail"] = "Введіть коректну електронну пошту.";
  } else {
    const duplicate = existingTutors.find(
      (t) => t.email.toLowerCase() === emailClean && t.tutorId !== editingTutorId
    );
    if (duplicate) {
      errors["tutorEmail"] = "Репетитор із такою поштою вже зареєстрований.";
    }
  }

  if (data.phoneNumber.trim().length < 10) {
    errors["tutorPhone"] = "Введіть коректний номер телефону (мінімум 10 цифр).";
  }

  if (data.qualificationLevel.trim().length < 2) {
    errors["tutorQualification"] = "Кваліфікація повинна містити мінімум 2 символи.";
  }

  if (isNaN(data.hourlyRate) || data.hourlyRate <= 0) {
    errors["tutorRate"] = "Вартість години має бути більшою за 0 грн.";
  }

  if (isNaN(data.experienceYears) || data.experienceYears < 0) {
    errors["tutorExperience"] = "Досвід викладання не може бути від'ємним.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}


export function validateStudentForm(
  data: StudentFormData,
  existingStudents: Student[]
): ValidationResult {
  const errors: { [key: string]: string } = {};

  if (data.firstName.trim().length < 2) {
    errors["studentFirstName"] = "Ім'я учня повинно містити мінімум 2 символи.";
  }

  if (data.lastName.trim().length < 2) {
    errors["studentLastName"] = "Прізвище учня повинно містити мінімум 2 символи.";
  }

  const emailClean = data.email.trim().toLowerCase();
  if (!emailClean.includes("@") || !emailClean.includes(".")) {
    errors["studentEmail"] = "Введіть коректну електронну пошту учня.";
  } else {
    const duplicate = existingStudents.find((s) => s.email.toLowerCase() === emailClean);
    if (duplicate) {
      errors["studentEmail"] = "Учень із такою поштою вже є у списку.";
    }
  }

  if (data.phoneNumber.trim().length < 10) {
    errors["studentPhone"] = "Введіть коректний номер телефону.";
  }

  if (!data.gradeLevel.trim()) {
    errors["studentGrade"] = "Вкажіть клас або курс навчання.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}


export function validateLessonForm(
  data: LessonFormData,
  existingSchedule: ScheduleLesson[],
  tutorSubjects: TutorSubjectOption[]
): ValidationResult {
  const errors: { [key: string]: string } = {};

  if (!data.scheduledTime) {
    errors["lessonTime"] = "Оберіть дату та час проведення уроку.";
  } else {
    const selectedTs = tutorSubjects.find((ts) => ts.tutorSubjectId === data.tutorSubjectId);
    const selectedTutorId = selectedTs ? selectedTs.tutorId : -1;

    const targetTime = data.scheduledTime.replace("T", " ").slice(0, 16);

    const conflict = existingSchedule.find((lesson) => {
      if (lesson.lessonStatus === "CANCELLED") return false;
      const existingTime = lesson.scheduledTime.replace("T", " ").slice(0, 16);
      if (existingTime !== targetTime) return false;
      return lesson.tutorId === selectedTutorId || lesson.studentId === data.studentId;
    });

    if (conflict) {
      errors["lessonTime"] =
        "На цей час у обраного викладача або учня вже призначено інше заняття!";
    }
  }

  if (isNaN(data.durationMinutes) || data.durationMinutes < 30 || data.durationMinutes > 240) {
    errors["lessonDuration"] = "Тривалість заняття має бути від 30 до 240 хвилин.";
  }

  if (data.hwTitle.trim().length < 3) {
    errors["hwTitle"] = "Вкажіть тему домашнього завдання (мінімум 3 символи).";
  }

  if (!data.hwDueDate) {
    errors["hwDueDate"] = "Оберіть кінцеву дату здачі домашнього завдання.";
  } else if (data.scheduledTime && new Date(data.hwDueDate) < new Date(data.scheduledTime)) {
    errors["hwDueDate"] = "Дедлайн домашнього завдання не може бути раніше самого уроку!";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}