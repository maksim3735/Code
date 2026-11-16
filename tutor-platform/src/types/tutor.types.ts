

export interface Tutor {
  tutorId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  qualificationLevel: string;
  hourlyRate: number;
  bio: string;
  subjectName: string;
  experienceYears: number;
  averageRating: number;
  completedLessons: number;
  totalEarnings: number;
}

export interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gradeLevel: string;
  pendingHwCount: number;
}

// 3. Заняття в розкладі
export interface ScheduleLesson {
  lessonId: number;
  tutorId: number;
  studentId: number;
  tutorName: string;
  subjectName: string;
  studentName: string;
  scheduledTime: string;
  durationMinutes: number;
  lessonFormat: "ONLINE" | "OFFLINE";
  lessonStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  calculatedCost: number;
  homeworkTitle: string;
}

// 4. Пара Репетитор + Предмет для випадаючого списку
export interface TutorSubjectOption {
  tutorSubjectId: number;
  tutorId: number;
  label: string;
}

// 5. Увесь стан даних, який приходить із бази
export interface DatabaseState {
  tutors: Tutor[];
  students: Student[];
  schedule: ScheduleLesson[];
  tutorSubjects: TutorSubjectOption[];
  subjectStats: { subjectName: string; lessonsCount: number }[];
}

// 6. Форма додавання/редагування репетитора
export interface TutorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  qualificationLevel: string;
  hourlyRate: number;
  subjectName: string;
  experienceYears: number;
  bio: string;
}

// 7. Форма додавання учня
export interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gradeLevel: string;
}

// 8. Форма призначення нового заняття (із домашнім завданням)
export interface LessonFormData {
  tutorSubjectId: number;
  studentId: number;
  scheduledTime: string;
  durationMinutes: number;
  lessonFormat: "ONLINE" | "OFFLINE";
  hwTitle: string;
  hwDescription: string;
  hwDueDate: string;
}

// 9. Результат валідації будь-якої форми
export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}