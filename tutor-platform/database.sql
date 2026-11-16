

DROP VIEW IF EXISTS v_tutors_schedule CASCADE;
DROP TABLE IF EXISTS homeworks CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS tutor_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;


CREATE TABLE tutors (
    tutor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    qualification_level VARCHAR(50) NOT NULL,
    hourly_rate NUMERIC(8, 2) NOT NULL CHECK (hourly_rate > 0),
    bio VARCHAR(500)
);

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    grade_level VARCHAR(50) NOT NULL
);

CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL
);

CREATE TABLE tutor_subjects (
    tutor_subject_id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL,
    subject_id INT NOT NULL,
    experience_years INT DEFAULT 0 CHECK (experience_years >= 0),
    CONSTRAINT fk_ts_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT uq_tutor_subject UNIQUE (tutor_id, subject_id)
);

CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    tutor_subject_id INT NOT NULL,
    student_id INT NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 60 CHECK (duration_minutes > 0),
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    lesson_format VARCHAR(20) DEFAULT 'ONLINE' CHECK (lesson_format IN ('ONLINE', 'OFFLINE')),
    CONSTRAINT fk_lessons_tutor_subject FOREIGN KEY (tutor_subject_id) REFERENCES tutor_subjects(tutor_subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_lessons_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL,
    amount NUMERIC(8, 2) NOT NULL CHECK (amount >= 0),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'FAILED')),
    CONSTRAINT fk_payments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment_text VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE
);

CREATE TABLE homeworks (
    homework_id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL,
    student_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'COMPLETED')),
    CONSTRAINT fk_hw_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    CONSTRAINT fk_hw_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);


INSERT INTO tutors (first_name, last_name, email, phone_number, qualification_level, hourly_rate, bio) VALUES
('Олександр', 'Коваленко', 'kovalenko@gmail.com', '+380501112233', 'Кандидат наук', 450.00, 'Досвід підготовки до НМТ понад 8 років.'),
('Олена', 'Шевченко', 'shevchenko.o@ukr.net', '+380672223344', 'Магістр філології', 350.00, 'Сертифікований викладач англійської мови (C2).'),
('Максим', 'Бондаренко', 'max.bond@gmail.com', '+380933334455', 'Студент магістратури', 250.00, 'Пояснюю математику простою та доступною мовою.'),
('Ірина', 'Мельник', 'iryna.melnyk@gmail.com', '+380504445566', 'Вчитель вищої категорії', 400.00, 'Спеціалізуюсь на шкільній фізиці та олімпіадах.'),
('Дмитро', 'Ткаченко', 'tkachenko.d@gmail.com', '+380675556677', 'Практикуючий інженер', 500.00, 'Викладаю основи програмування та алгоритми.'),
('Тетяна', 'Кравчук', 'kravchuk.t@ukr.net', '+380936667788', 'Викладач університету', 380.00, 'Історія України: підготовка до іспитів за авторською методикою.');

INSERT INTO students (first_name, last_name, email, phone_number, grade_level) VALUES
('Богдан', 'Павленко', 'pavlenko.b@gmail.com', '+380991112233', '11 клас'),
('Анна', 'Савчук', 'savchuk.a@gmail.com', '+380982223344', '10 клас'),
('Денис', 'Коваль', 'koval.d@gmail.com', '+380633334455', '9 клас'),
('Софія', 'Руденко', 'rudenko.s@ukr.net', '+380994445566', '11 клас'),
('Ярослав', 'Мороз', 'moroz.y@gmail.com', '+380985556677', '1 курс університету'),
('Вікторія', 'Петренко', 'petrenko.v@gmail.com', '+380636667788', '8 клас'),
('Артем', 'Клименко', 'klymenko.a@ukr.net', '+380997778899', '11 клас'),
('Діана', 'Марченко', 'marchenko.d@gmail.com', '+380988889900', '7 клас');

INSERT INTO subjects (subject_name, category) VALUES
('Математика', 'Точні науки'),
('Англійська мова', 'Іноземні мови'),
('Фізика', 'Точні науки'),
('Програмування', 'IT та технології'),
('Історія України', 'Гуманітарні науки'),
('Хімія', 'Природничі науки');

INSERT INTO tutor_subjects (tutor_id, subject_id, experience_years) VALUES
(1, 1, 8), (1, 3, 5), (2, 2, 6), (3, 1, 3), (4, 3, 12), (4, 1, 10), (5, 4, 7), (6, 5, 9);

INSERT INTO lessons (tutor_subject_id, student_id, scheduled_time, duration_minutes, status, lesson_format) VALUES
(1, 1, '2026-10-10 15:00:00', 60, 'COMPLETED', 'ONLINE'),
(1, 1, '2026-10-12 15:00:00', 60, 'COMPLETED', 'OFFLINE'),
(3, 2, '2026-10-11 16:30:00', 90, 'COMPLETED', 'ONLINE'),
(4, 3, '2026-10-12 18:00:00', 60, 'COMPLETED', 'ONLINE'),
(5, 4, '2026-10-13 14:00:00', 60, 'COMPLETED', 'OFFLINE'),
(7, 5, '2026-10-14 17:00:00', 90, 'COMPLETED', 'ONLINE'),
(8, 6, '2026-10-15 16:00:00', 60, 'COMPLETED', 'ONLINE'),
(1, 7, '2026-10-16 15:00:00', 60, 'COMPLETED', 'OFFLINE'),
(2, 1, '2026-10-17 14:00:00', 60, 'COMPLETED', 'ONLINE'),
(7, 5, '2026-10-20 17:00:00', 90, 'SCHEDULED', 'ONLINE'),
(3, 2, '2026-10-21 16:30:00', 90, 'SCHEDULED', 'ONLINE'),
(4, 8, '2026-10-22 18:00:00', 60, 'CANCELLED', 'ONLINE');

INSERT INTO payments (lesson_id, amount, payment_date, payment_status) VALUES
(1, 450.00, '2026-10-10 16:05:00', 'PAID'),
(2, 450.00, '2026-10-12 16:02:00', 'PAID'),
(3, 525.00, '2026-10-11 18:05:00', 'PAID'),
(4, 250.00, '2026-10-12 19:01:00', 'PAID'),
(5, 400.00, '2026-10-13 15:05:00', 'PAID'),
(6, 750.00, '2026-10-14 18:35:00', 'PAID'),
(7, 380.00, '2026-10-15 17:05:00', 'PAID'),
(8, 450.00, '2026-10-16 16:01:00', 'PAID'),
(9, 450.00, '2026-10-17 15:02:00', 'PAID');

INSERT INTO reviews (tutor_id, rating, comment_text) VALUES
(1, 5, 'Чудовий репетитор, пояснив параметри за два уроки!'),
(1, 5, 'Дуже задоволений підготовкою до НМТ.'),
(2, 5, 'Прекрасна вимова, уроки проходять дуже динамічно.'),
(3, 4, 'Гарний викладач, але іноді поспішає.'),
(4, 5, 'Фізика нарешті стала зрозумілою! Дякую.'),
(5, 5, 'Професіонал своєї справи, розібрали складні алгоритми.'),
(6, 4, 'Цікаві лекції з історії, багато візуальних матеріалів.');

INSERT INTO homeworks (lesson_id, student_id, title, description, assigned_date, due_date, status) VALUES
(1, 1, 'Параметричні рівняння', 'Розв''язати завдання №14–25 з підручника.', '2026-10-10 16:00:00', '2026-10-12 14:00:00', 'COMPLETED'),
(2, 1, 'Тригонометричні нерівності', 'Виконати тест на платформі, варіант 3.', '2026-10-12 16:00:00', '2026-10-15 18:00:00', 'COMPLETED'),
(3, 2, 'Essay on Climate Change', 'Написати есе на 250 слів у форматі B2.', '2026-10-11 18:00:00', '2026-10-18 20:00:00', 'SUBMITTED'),
(4, 3, 'Квадратні рівняння', 'Опрацювати теорему Вієта, номери 102–115.', '2026-10-12 19:00:00', '2026-10-16 18:00:00', 'PENDING'),
(5, 4, 'Закони Ньютона', 'Розв''язати 5 задач на сили тертя та тяжіння.', '2026-10-13 15:00:00', '2026-10-17 12:00:00', 'COMPLETED'),
(6, 5, 'Динамічні масиви в C++', 'Реалізувати однозв''язний список та сортування.', '2026-10-14 18:30:00', '2026-10-21 23:59:00', 'PENDING');

-- Представлення VIEW для розкладу занять (Лаб 7, Завдання 4 + вартість з Завдання 1)
CREATE OR REPLACE VIEW v_tutors_schedule AS
SELECT 
    l.lesson_id,
    t.tutor_id,
    t.first_name || ' ' || t.last_name AS tutor_name,
    s.subject_name,
    st.first_name || ' ' || st.last_name AS student_name,
    l.scheduled_time,
    l.duration_minutes,
    l.lesson_format,
    l.status AS lesson_status,
    ROUND(t.hourly_rate * (l.duration_minutes / 60.0), 2) AS calculated_cost
FROM lessons l
JOIN tutor_subjects ts ON l.tutor_subject_id = ts.tutor_subject_id
JOIN tutors t ON ts.tutor_id = t.tutor_id
JOIN subjects s ON ts.subject_id = s.subject_id
JOIN students st ON l.student_id = st.student_id;