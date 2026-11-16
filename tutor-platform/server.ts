

import express from "express"; // сервер
import cors from "cors"; //різні порти
import pg from "pg"; // база даних PostgreSQL

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres", 
  password: "3735", 
  port: 5432,
});


//Отримання даних з бази даних
app.get("/api/data", async (_req, res) => {
  try {
    const tutorsRes = await pool.query(`
      SELECT 
        t.tutor_id AS "tutorId",
        t.first_name AS "firstName",
        t.last_name AS "lastName",
        t.email,
        t.phone_number AS "phoneNumber",
        t.qualification_level AS "qualificationLevel",
        ROUND(t.hourly_rate, 2) AS "hourlyRate",
        COALESCE(t.bio, '') AS bio,
        COALESCE((
          SELECT s.subject_name 
          FROM tutor_subjects ts 
          JOIN subjects s ON ts.subject_id = s.subject_id 
          WHERE ts.tutor_id = t.tutor_id 
          LIMIT 1
        ), 'Математика') AS "subjectName",
        COALESCE((
          SELECT ts.experience_years 
          FROM tutor_subjects ts 
          WHERE ts.tutor_id = t.tutor_id 
          LIMIT 1
        ), 1) AS "experienceYears",
        COALESCE((
          SELECT ROUND(AVG(r.rating), 1) 
          FROM reviews r 
          WHERE r.tutor_id = t.tutor_id
        ), 5.0) AS "averageRating",
        (
          SELECT COUNT(l.lesson_id)
          FROM tutor_subjects ts
          JOIN lessons l ON ts.tutor_subject_id = l.tutor_subject_id
          WHERE ts.tutor_id = t.tutor_id AND l.status = 'COMPLETED'
        ) AS "completedLessons",
        COALESCE((
          SELECT ROUND(SUM(t.hourly_rate * (l.duration_minutes / 60.0)), 2)
          FROM tutor_subjects ts
          JOIN lessons l ON ts.tutor_subject_id = l.tutor_subject_id
          WHERE ts.tutor_id = t.tutor_id AND l.status = 'COMPLETED'
        ), 0) AS "totalEarnings"
      FROM tutors t
      ORDER BY t.tutor_id DESC;
    `);

    const studentsRes = await pool.query(`
      SELECT 
        st.student_id AS "studentId",
        st.first_name AS "firstName",
        st.last_name AS "lastName",
        st.email,
        st.phone_number AS "phoneNumber",
        st.grade_level AS "gradeLevel",
        (
          SELECT COUNT(h.homework_id)
          FROM homeworks h
          WHERE h.student_id = st.student_id AND h.status != 'COMPLETED'
        ) AS "pendingHwCount"
      FROM students st
      ORDER BY st.student_id DESC;
    `);

    const scheduleRes = await pool.query(`
      SELECT 
        v.lesson_id AS "lessonId",
        v.tutor_id AS "tutorId",
        l.student_id AS "studentId",
        v.tutor_name AS "tutorName",
        v.subject_name AS "subjectName",
        v.student_name AS "studentName",
        TO_CHAR(v.scheduled_time, 'YYYY-MM-DD"T"HH24:MI') AS "scheduledTime",
        v.duration_minutes AS "durationMinutes",
        v.lesson_format AS "lessonFormat",
        v.lesson_status AS "lessonStatus",
        v.calculated_cost AS "calculatedCost",
        COALESCE((
          SELECT h.title FROM homeworks h WHERE h.lesson_id = v.lesson_id LIMIT 1
        ), 'Без ДЗ') AS "homeworkTitle"
      FROM v_tutors_schedule v
      JOIN lessons l ON v.lesson_id = l.lesson_id
      ORDER BY v.scheduled_time DESC;
    `);

    const subjStatsRes = await pool.query(`
      SELECT 
        s.subject_name AS "subjectName",
        COUNT(l.lesson_id) AS "lessonsCount"
      FROM subjects s
      LEFT JOIN tutor_subjects ts ON s.subject_id = ts.subject_id
      LEFT JOIN lessons l ON ts.tutor_subject_id = l.tutor_subject_id AND l.status = 'COMPLETED'
      GROUP BY s.subject_id, s.subject_name
      ORDER BY "lessonsCount" DESC;
    `);

    const tsRes = await pool.query(`
      SELECT 
        ts.tutor_subject_id AS "tutorSubjectId",
        ts.tutor_id AS "tutorId",
        t.first_name || ' ' || t.last_name || ' — ' || s.subject_name || ' (' || t.hourly_rate || ' грн/год)' AS label
      FROM tutor_subjects ts
      JOIN tutors t ON ts.tutor_id = t.tutor_id
      JOIN subjects s ON ts.subject_id = s.subject_id
      ORDER BY t.first_name ASC;
    `);

    res.json({
      tutors: tutorsRes.rows,
      students: studentsRes.rows,
      schedule: scheduleRes.rows,
      subjectStats: subjStatsRes.rows,
      tutorSubjects: tsRes.rows,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


// Додавання репетитора
app.post("/api/tutors", async (req, res) => {
  const { firstName, lastName, email, phoneNumber, qualificationLevel, hourlyRate, subjectName, experienceYears, bio } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tutorRes = await client.query(
      `INSERT INTO tutors (first_name, last_name, email, phone_number, qualification_level, hourly_rate, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING tutor_id`,
      [firstName, lastName, email, phoneNumber, qualificationLevel, Number(hourlyRate), bio]
    );
    const newTutorId = tutorRes.rows[0].tutor_id;

    const subjRes = await pool.query(`SELECT subject_id FROM subjects WHERE subject_name = $1 LIMIT 1`, [subjectName]);
    if (subjRes.rows.length > 0) {
      await client.query(
        `INSERT INTO tutor_subjects (tutor_id, subject_id, experience_years) 
         VALUES ($1, $2, $3)`,
        [newTutorId, subjRes.rows[0].subject_id, Number(experienceYears)]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Редагування репетитора
app.put("/api/tutors/:id", async (req, res) => {
  const tutorId = Number(req.params.id);
  const { firstName, lastName, email, phoneNumber, qualificationLevel, hourlyRate, bio } = req.body;
  try {
    await pool.query(
      `UPDATE tutors 
       SET first_name = $1, last_name = $2, email = $3, phone_number = $4, qualification_level = $5, hourly_rate = $6, bio = $7
       WHERE tutor_id = $8`,
      [firstName, lastName, email, phoneNumber, qualificationLevel, Number(hourlyRate), bio, tutorId]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Видалення репетитора
app.delete("/api/tutors/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM tutors WHERE tutor_id = $1`, 
      [Number(req.params.id)]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Додавання нового учня
app.post("/api/students", async (req, res) => {
  const { firstName, lastName, email, phoneNumber, gradeLevel } = req.body;
  try {
    await pool.query(
      `INSERT INTO students (first_name, last_name, email, phone_number, grade_level)
       VALUES ($1, $2, $3, $4, $5)`,
      [firstName, lastName, email, phoneNumber, gradeLevel]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Видалення учня
app.delete("/api/students/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM students WHERE student_id = $1`, [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Призначення нового заняття разом із домашнім завданням (Транзакція)
app.post("/api/lessons", async (req, res) => {
  const { tutorSubjectId, studentId, scheduledTime, durationMinutes, lessonFormat, hwTitle, hwDescription, hwDueDate } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lessonInsert = await client.query(
      `INSERT INTO lessons (tutor_subject_id, student_id, scheduled_time, duration_minutes, status, lesson_format)
       VALUES ($1, $2, $3, $4, 'SCHEDULED', $5)
       RETURNING lesson_id`,
      [Number(tutorSubjectId), Number(studentId), scheduledTime, Number(durationMinutes), lessonFormat]
    );
    const newLessonId = lessonInsert.rows[0].lesson_id;

    await client.query(
      `INSERT INTO homeworks (lesson_id, student_id, title, description, assigned_date, due_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, 'PENDING')`,
      [newLessonId, Number(studentId), hwTitle, hwDescription, hwDueDate]
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Зміна статусу заняття
app.put("/api/lessons/:id/status", async (req, res) => {
  const lessonId = Number(req.params.id);
  const { status } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE lessons SET status = $1 WHERE lesson_id = $2`, 
      [status, lessonId]
    );

    if (status === "COMPLETED") {
      await client.query(`UPDATE homeworks SET status = 'COMPLETED' WHERE lesson_id = $1`, 
        [lessonId]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Очищення розкладу від скасованих та завершених занять
app.delete("/api/lessons/cleanup", async (_req, res) => {
  try {
    await pool.query(`DELETE FROM lessons WHERE status = 'CANCELLED'`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Сервер запущено на http://localhost:3000");
});