

import type {
  DatabaseState,
  Tutor,
  TutorFormData,
  StudentFormData,
  LessonFormData,
} from "./types/tutor.types";
import {
  fetchDatabaseState,
  createTutorInDb,
  updateTutorInDb,
  deleteTutorFromDb,
  createStudentInDb,
  deleteStudentFromDb,
  createLessonWithHomeworkInDb,
  updateLessonStatusInDb,
  cleanupCancelledLessonsInDb,
} from "./services/db.service";
import {
  validateTutorForm,
  validateStudentForm,
  validateLessonForm,
} from "./utils/validation";
import {
  formatDateTime,
  isLessonActual,
  translateStatus,
  getStatusBadgeClass,
} from "./utils/calculations";
import { renderEarningsChart, renderSubjectsChart } from "./ui/charts.view";

let dbState: DatabaseState = {
  tutors: [],
  students: [],
  schedule: [],
  tutorSubjects: [],
  subjectStats: [],
};

let editingTutorId: number | null = null;
let scheduleCurrentPage = 1;
let studentsCurrentPage = 1;
const PAGE_SIZE = 10;

// Елементи Розкладу
const scheduleTbody = document.getElementById("schedule-tbody") as HTMLElement;
const scheduleSearchInput = document.getElementById("schedule-search-input") as HTMLInputElement;
const scheduleFilterSelect = document.getElementById("schedule-filter-select") as HTMLSelectElement;
const btnSchedulePrev = document.getElementById("btn-schedule-prev") as HTMLButtonElement;
const btnScheduleNext = document.getElementById("btn-schedule-next") as HTMLButtonElement;
const schedulePageInfo = document.getElementById("schedule-page-info") as HTMLElement;
const btnCleanupSchedule = document.getElementById("btn-cleanup-schedule") as HTMLButtonElement;

// Елементи Репетиторів
const tutorsGrid = document.getElementById("tutors-grid") as HTMLElement;
const tutorsEmptyMsg = document.getElementById("tutors-empty-msg") as HTMLElement;
const tutorSearchInput = document.getElementById("tutor-search-input") as HTMLInputElement;
const tutorSubjectFilter = document.getElementById("tutor-subject-filter") as HTMLSelectElement;

// Елементи Учнів
const studentsTbody = document.getElementById("students-tbody") as HTMLElement;
const studentSearchInput = document.getElementById("student-search-input") as HTMLInputElement;
const btnStudentsPrev = document.getElementById("btn-students-prev") as HTMLButtonElement;
const btnStudentsNext = document.getElementById("btn-students-next") as HTMLButtonElement;
const studentsPageInfo = document.getElementById("students-page-info") as HTMLElement;

// Елементи Статистики
const statTutorsCount = document.getElementById("stat-tutors-count") as HTMLElement;
const statStudentsCount = document.getElementById("stat-students-count") as HTMLElement;
const statLessonsCount = document.getElementById("stat-lessons-count") as HTMLElement;
const statTotalRevenue = document.getElementById("stat-total-revenue") as HTMLElement;
const earningsCanvas = document.getElementById("earningsChart") as HTMLCanvasElement;
const subjectsCanvas = document.getElementById("subjectsChart") as HTMLCanvasElement;

// Модальне вікно 1: Заняття
const lessonModal = document.getElementById("lesson-modal") as HTMLElement;
const lessonForm = document.getElementById("lesson-form") as HTMLFormElement;
const lessonTutorSelect = document.getElementById("lesson-tutor-select") as HTMLSelectElement;
const lessonStudentSelect = document.getElementById("lesson-student-select") as HTMLSelectElement;
const lessonTimeInput = document.getElementById("lesson-time-input") as HTMLInputElement;
const lessonDurationInput = document.getElementById("lesson-duration-input") as HTMLInputElement;
const lessonFormatSelect = document.getElementById("lesson-format-select") as HTMLSelectElement;
const lessonHwTitle = document.getElementById("lesson-hw-title") as HTMLInputElement;
const lessonHwDue = document.getElementById("lesson-hw-due") as HTMLInputElement;
const lessonHwDesc = document.getElementById("lesson-hw-desc") as HTMLInputElement;

// Модальне вікно 2: Репетитор
const tutorModal = document.getElementById("tutor-modal") as HTMLElement;
const tutorModalTitle = document.getElementById("tutor-modal-title") as HTMLElement;
const tutorForm = document.getElementById("tutor-form") as HTMLFormElement;
const formTutorFirst = document.getElementById("form-tutor-first") as HTMLInputElement;
const formTutorLast = document.getElementById("form-tutor-last") as HTMLInputElement;
const formTutorEmail = document.getElementById("form-tutor-email") as HTMLInputElement;
const formTutorPhone = document.getElementById("form-tutor-phone") as HTMLInputElement;
const formTutorSubject = document.getElementById("form-tutor-subject") as HTMLSelectElement;
const formTutorQual = document.getElementById("form-tutor-qual") as HTMLInputElement;
const formTutorRate = document.getElementById("form-tutor-rate") as HTMLInputElement;
const formTutorExp = document.getElementById("form-tutor-exp") as HTMLInputElement;
const formTutorBio = document.getElementById("form-tutor-bio") as HTMLInputElement;

// Модальне вікно 3: Учень
const studentModal = document.getElementById("student-modal") as HTMLElement;
const studentForm = document.getElementById("student-form") as HTMLFormElement;
const formStudentFirst = document.getElementById("form-student-first") as HTMLInputElement;
const formStudentLast = document.getElementById("form-student-last") as HTMLInputElement;
const formStudentEmail = document.getElementById("form-student-email") as HTMLInputElement;
const formStudentPhone = document.getElementById("form-student-phone") as HTMLInputElement;
const formStudentGrade = document.getElementById("form-student-grade") as HTMLInputElement;


function clearFormErrors(form: HTMLFormElement): void {
  form.querySelectorAll(".error-msg").forEach((el) => (el.textContent = ""));
}

function showFieldErrors(errors: { [key: string]: string }): void {
  Object.entries(errors).forEach(([key, msg]) => {
    const span = document.getElementById(`err-${key}`);
    if (span) span.textContent = msg;
  });
}

function renderScheduleSection(): void {
  const search = scheduleSearchInput.value.trim().toLowerCase();
  const filterMode = scheduleFilterSelect.value;

  const filtered = dbState.schedule.filter((item) => {
    if (filterMode === "ACTUAL" && !isLessonActual(item)) return false;
    if (filterMode === "SCHEDULED" && item.lessonStatus !== "SCHEDULED") return false;
    if (filterMode === "COMPLETED" && item.lessonStatus !== "COMPLETED") return false;

    if (search.length > 0) {
      const names = `${item.tutorName} ${item.studentName}`.toLowerCase();
      return names.includes(search);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  if (scheduleCurrentPage > totalPages) scheduleCurrentPage = totalPages;
  if (scheduleCurrentPage < 1) scheduleCurrentPage = 1;

  const startIdx = (scheduleCurrentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  scheduleTbody.innerHTML = "";

  if (pageItems.length === 0) {
    scheduleTbody.innerHTML = `<tr><td colspan="10" class="empty-table-cell">Занять за обраними параметрами немає</td></tr>`;
  } else {
    pageItems.forEach((row) => {
      const tr = document.createElement("tr");
      const isScheduled = row.lessonStatus === "SCHEDULED";

      tr.innerHTML = `
        <td><strong>${formatDateTime(row.scheduledTime)}</strong></td>
        <td>${row.tutorName}</td>
        <td>${row.subjectName}</td>
        <td>${row.studentName}</td>
        <td>${row.durationMinutes} хв</td>
        <td><span class="${getStatusBadgeClass(row.lessonFormat)}">${translateStatus(row.lessonFormat)}</span></td>
        <td>${row.homeworkTitle}</td>
        <td><strong>${row.calculatedCost} грн</strong></td>
        <td><span class="${getStatusBadgeClass(row.lessonStatus)}">${translateStatus(row.lessonStatus)}</span></td>
        <td class="actions-cell">
          ${
            isScheduled
              ? `<button class="btn btn-success btn-sm btn-complete">Проведено</button>
                 <button class="btn btn-danger btn-sm btn-cancel">Скасувати</button>`
              : `<span style="color: var(--text-muted); font-size: 13px;">Завершено</span>`
          }
        </td>
      `;

      if (isScheduled) {
        tr.querySelector(".btn-complete")!.addEventListener("click", async () => {
          await updateLessonStatusInDb(row.lessonId, "COMPLETED");
          await refreshAll();
        });
        tr.querySelector(".btn-cancel")!.addEventListener("click", async () => {
          await updateLessonStatusInDb(row.lessonId, "CANCELLED");
          await refreshAll();
        });
      }

      scheduleTbody.appendChild(tr);
    });
  }

  schedulePageInfo.textContent = `Сторінка ${scheduleCurrentPage} з ${totalPages}`;
  btnSchedulePrev.disabled = scheduleCurrentPage <= 1;
  btnScheduleNext.disabled = scheduleCurrentPage >= totalPages;
}


function renderTutorsSection(): void {
  const searchName = tutorSearchInput.value.trim().toLowerCase();
  const subjectFilter = tutorSubjectFilter.value;

  const filtered = dbState.tutors.filter((t) => {
    const matchesSubject = subjectFilter === "ALL" || t.subjectName === subjectFilter;
    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
    const matchesName = searchName === "" || fullName.includes(searchName);
    return matchesSubject && matchesName;
  });

  tutorsGrid.innerHTML = "";

  if (filtered.length === 0) {
    tutorsEmptyMsg.classList.remove("hidden");
    return;
  }
  tutorsEmptyMsg.classList.add("hidden");

  filtered.forEach((tutor) => {
    const card = document.createElement("div");
    card.className = "tutor-card";
    card.innerHTML = `
      <div class="tutor-card-header">
        <div>
          <div class="tutor-name">${tutor.firstName} ${tutor.lastName}</div>
          <div style="font-size: 14px; color: var(--text-muted);">${tutor.qualificationLevel} • Досвід: ${tutor.experienceYears} р.</div>
        </div>
        <span class="tutor-subject-badge">${tutor.subjectName}</span>
      </div>
      <p class="tutor-bio">${tutor.bio || "Індивідуальна підготовка та пояснення матеріалу."}</p>
      <div class="tutor-meta">
        <span>Вартість: <strong>${tutor.hourlyRate} грн/год</strong></span>
        <span>Оцінка: <strong>★ ${tutor.averageRating}</strong></span>
      </div>
      <div class="tutor-meta">
        <span>Проведено уроків: <strong>${tutor.completedLessons}</strong></span>
        <span>Телефон: <strong>${tutor.phoneNumber}</strong></span>
      </div>
      <div class="tutor-card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-tutor">Редагувати</button>
        <button class="btn btn-danger btn-sm btn-delete-tutor">Видалити</button>
      </div>
    `;

    card.querySelector(".btn-edit-tutor")!.addEventListener("click", () => openEditTutorModal(tutor));
    card.querySelector(".btn-delete-tutor")!.addEventListener("click", async () => {
      if (!confirm(`Видалити викладача ${tutor.firstName} ${tutor.lastName}?`)) return;
      await deleteTutorFromDb(tutor.tutorId);
      await refreshAll();
    });

    tutorsGrid.appendChild(card);
  });
}

function renderStudentsSection(): void {
  const search = studentSearchInput.value.trim().toLowerCase();

  const filtered = dbState.students.filter((st) => {
    const fullName = `${st.firstName} ${st.lastName}`.toLowerCase();
    return search === "" || fullName.includes(search);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  if (studentsCurrentPage > totalPages) studentsCurrentPage = totalPages;
  if (studentsCurrentPage < 1) studentsCurrentPage = 1;

  const startIdx = (studentsCurrentPage - 1) * PAGE_SIZE;
  const pageStudents = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  studentsTbody.innerHTML = "";

  if (pageStudents.length === 0) {
    studentsTbody.innerHTML = `<tr><td colspan="6" class="empty-table-cell">Учнів не знайдено</td></tr>`;
  } else {
    pageStudents.forEach((st) => {
      const tr = document.createElement("tr");
      const hwBadge =
        Number(st.pendingHwCount) > 0
          ? `<span class="badge badge-warning">Активних ДЗ: ${st.pendingHwCount}</span>`
          : `<span class="badge badge-success">Усе здано</span>`;

      tr.innerHTML = `
        <td><strong>${st.firstName} ${st.lastName}</strong></td>
        <td>${st.gradeLevel}</td>
        <td>${st.email}</td>
        <td>${st.phoneNumber}</td>
        <td>${hwBadge}</td>
        <td>
          <button class="btn btn-danger btn-sm btn-del-student">Видалити</button>
        </td>
      `;

      tr.querySelector(".btn-del-student")!.addEventListener("click", async () => {
        if (!confirm(`Видалити учня ${st.firstName} ${st.lastName}?`)) return;
        await deleteStudentFromDb(st.studentId);
        await refreshAll();
      });

      studentsTbody.appendChild(tr);
    });
  }

  studentsPageInfo.textContent = `Сторінка ${studentsCurrentPage} з ${totalPages}`;
  btnStudentsPrev.disabled = studentsCurrentPage <= 1;
  btnStudentsNext.disabled = studentsCurrentPage >= totalPages;
}


function renderStatsSection(): void {
  statTutorsCount.textContent = String(dbState.tutors.length);
  statStudentsCount.textContent = String(dbState.students.length);

  const completedCount = dbState.schedule.filter((s) => s.lessonStatus === "COMPLETED").length;
  statLessonsCount.textContent = String(completedCount);

  const totalRevenue = dbState.tutors.reduce((acc, t) => acc + Number(t.totalEarnings), 0);
  statTotalRevenue.textContent = `${totalRevenue.toFixed(0)} грн`;

  renderEarningsChart(earningsCanvas, dbState.tutors);
  renderSubjectsChart(subjectsCanvas, dbState.subjectStats);
}

async function refreshAll(): Promise<void> {
  dbState = await fetchDatabaseState();
  renderScheduleSection();
  renderTutorsSection();
  renderStudentsSection();
  renderStatsSection();
}


function openLessonModal(): void {
  lessonForm.reset();
  clearFormErrors(lessonForm);
  lessonTutorSelect.innerHTML = dbState.tutorSubjects
    .map((ts) => `<option value="${ts.tutorSubjectId}">${ts.label}</option>`)
    .join("");
  lessonStudentSelect.innerHTML = dbState.students
    .map((st) => `<option value="${st.studentId}">${st.firstName} ${st.lastName} (${st.gradeLevel})</option>`)
    .join("");

  lessonModal.classList.remove("hidden");
}

lessonForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFormErrors(lessonForm);

  const formData: LessonFormData = {
    tutorSubjectId: Number(lessonTutorSelect.value),
    studentId: Number(lessonStudentSelect.value),
    scheduledTime: lessonTimeInput.value,
    durationMinutes: Number(lessonDurationInput.value),
    lessonFormat: lessonFormatSelect.value as "ONLINE" | "OFFLINE",
    hwTitle: lessonHwTitle.value.trim(),
    hwDescription: lessonHwDesc.value.trim(),
    hwDueDate: lessonHwDue.value,
  };

  const validation = validateLessonForm(formData, dbState.schedule, dbState.tutorSubjects);
  if (!validation.isValid) {
    showFieldErrors(validation.errors);
    return;
  }

  const res = await createLessonWithHomeworkInDb(formData);
  if (!res.ok) {
    showFieldErrors({ lessonTime: res.error || "Помилка збереження заняття." });
    return;
  }

  lessonModal.classList.add("hidden");
  await refreshAll();
});


function openAddTutorModal(): void {
  editingTutorId = null;
  tutorModalTitle.textContent = "Додати репетитора";
  tutorForm.reset();
  clearFormErrors(tutorForm);
  tutorModal.classList.remove("hidden");
}

function openEditTutorModal(tutor: Tutor): void {
  editingTutorId = tutor.tutorId;
  tutorModalTitle.textContent = "Редагувати дані викладача";
  formTutorFirst.value = tutor.firstName;
  formTutorLast.value = tutor.lastName;
  formTutorEmail.value = tutor.email;
  formTutorPhone.value = tutor.phoneNumber;
  formTutorSubject.value = tutor.subjectName;
  formTutorQual.value = tutor.qualificationLevel;
  formTutorRate.value = String(tutor.hourlyRate);
  formTutorExp.value = String(tutor.experienceYears);
  formTutorBio.value = tutor.bio;
  clearFormErrors(tutorForm);
  tutorModal.classList.remove("hidden");
}

tutorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFormErrors(tutorForm);

  const formData: TutorFormData = {
    firstName: formTutorFirst.value.trim(),
    lastName: formTutorLast.value.trim(),
    email: formTutorEmail.value.trim(),
    phoneNumber: formTutorPhone.value.trim(),
    qualificationLevel: formTutorQual.value.trim(),
    hourlyRate: Number(formTutorRate.value),
    subjectName: formTutorSubject.value,
    experienceYears: Number(formTutorExp.value),
    bio: formTutorBio.value.trim(),
  };

  const validation = validateTutorForm(formData, dbState.tutors, editingTutorId);
  if (!validation.isValid) {
    showFieldErrors(validation.errors);
    return;
  }

  const res = editingTutorId
    ? await updateTutorInDb(editingTutorId, formData)
    : await createTutorInDb(formData);

  if (!res.ok) {
    showFieldErrors({ tutorEmail: res.error || "Помилка збереження." });
    return;
  }

  tutorModal.classList.add("hidden");
  await refreshAll();
});


function openAddStudentModal(): void {
  studentForm.reset();
  clearFormErrors(studentForm);
  studentModal.classList.remove("hidden");
}

studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFormErrors(studentForm);

  const formData: StudentFormData = {
    firstName: formStudentFirst.value.trim(),
    lastName: formStudentLast.value.trim(),
    email: formStudentEmail.value.trim(),
    phoneNumber: formStudentPhone.value.trim(),
    gradeLevel: formStudentGrade.value.trim(),
  };

  const validation = validateStudentForm(formData, dbState.students);
  if (!validation.isValid) {
    showFieldErrors(validation.errors);
    return;
  }

  const res = await createStudentInDb(formData);
  if (!res.ok) {
    showFieldErrors({ studentEmail: res.error || "Помилка збереження." });
    return;
  }

  studentModal.classList.add("hidden");
  await refreshAll();
});


document.getElementById("btn-open-lesson-modal")!.addEventListener("click", openLessonModal);
document.getElementById("btn-close-lesson-modal")!.addEventListener("click", () => lessonModal.classList.add("hidden"));
document.getElementById("btn-cancel-lesson-form")!.addEventListener("click", () => lessonModal.classList.add("hidden"));

document.getElementById("btn-open-tutor-modal")!.addEventListener("click", openAddTutorModal);
document.getElementById("btn-close-tutor-modal")!.addEventListener("click", () => tutorModal.classList.add("hidden"));
document.getElementById("btn-cancel-tutor-form")!.addEventListener("click", () => tutorModal.classList.add("hidden"));

document.getElementById("btn-open-student-modal")!.addEventListener("click", openAddStudentModal);
document.getElementById("btn-close-student-modal")!.addEventListener("click", () => studentModal.classList.add("hidden"));
document.getElementById("btn-cancel-student-form")!.addEventListener("click", () => studentModal.classList.add("hidden"));

btnCleanupSchedule.addEventListener("click", async () => {
  await cleanupCancelledLessonsInDb();
  await refreshAll();
});

scheduleSearchInput.addEventListener("input", () => {
  scheduleCurrentPage = 1;
  renderScheduleSection();
});
scheduleFilterSelect.addEventListener("change", () => {
  scheduleCurrentPage = 1;
  renderScheduleSection();
});
btnSchedulePrev.addEventListener("click", () => {
  if (scheduleCurrentPage > 1) {
    scheduleCurrentPage--;
    renderScheduleSection();
  }
});
btnScheduleNext.addEventListener("click", () => {
  scheduleCurrentPage++;
  renderScheduleSection();
});

tutorSearchInput.addEventListener("input", renderTutorsSection);
tutorSubjectFilter.addEventListener("change", renderTutorsSection);

studentSearchInput.addEventListener("input", () => {
  studentsCurrentPage = 1;
  renderStudentsSection();
});
btnStudentsPrev.addEventListener("click", () => {
  if (studentsCurrentPage > 1) {
    studentsCurrentPage--;
    renderStudentsSection();
  }
});
btnStudentsNext.addEventListener("click", () => {
  studentsCurrentPage++;
  renderStudentsSection();
});


refreshAll();