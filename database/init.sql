-- ==========================================
-- SEED DATA - Student Management System
-- PostgreSQL | Khớp với AGENTS.md
-- ==========================================
-- Tài khoản demo:
--   admin      / Admin@123     -> ADMIN
--   giaovu01   / Staff@123     -> ACADEMIC_STAFF
--   manager01  / Manager@123   -> MANAGER
--   teacher01  / Teacher@123   -> TEACHER (GVCN + GVBM Toán 10A1 HK1)
--   teacher02  / Teacher@123   -> TEACHER (GVBM Văn 10A1 HK1)
--   student01  / Student@123   -> STUDENT (lớp 10A1 HK1)
-- LƯU Ý: password_hash dưới đây là placeholder (bcrypt của "Password123!")
-- Backend cần chạy seed.ts riêng để hash đúng từng mật khẩu
-- ==========================================

TRUNCATE TABLE audit_logs, semester_report_details, semester_reports,
  subject_report_details, subject_reports, score_details, student_subject_scores,
  score_sheets, score_weights, teacher_assignments, student_class_enrollments,
  classes, system_parameters, semesters, school_years, grade_levels,
  subjects, users, teachers, students, role_permissions, permissions, roles
  RESTART IDENTITY CASCADE;

-- ==========================================
-- 1. ROLES
-- ==========================================
INSERT INTO roles (name) VALUES
  ('ADMIN'),
  ('ACADEMIC_STAFF'),
  ('MANAGER'),
  ('TEACHER'),
  ('STUDENT');

-- ==========================================
-- 2. PERMISSIONS
-- ==========================================
INSERT INTO permissions (action) VALUES
  ('manage_users'),
  ('manage_roles'),
  ('manage_system'),
  ('manage_students'),
  ('manage_classes'),
  ('manage_subjects'),
  ('manage_teachers'),
  ('manage_enrollments'),
  ('manage_assignments'),
  ('manage_scores'),
  ('lock_scores'),
  ('approve_score_changes'),
  ('view_reports'),
  ('manage_parameters'),
  ('view_own_scores'),
  ('view_homeroom_class');

-- ==========================================
-- 3. ROLE PERMISSIONS
-- ==========================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN'
  AND p.action IN ('manage_users','manage_roles','manage_system');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ACADEMIC_STAFF'
  AND p.action IN (
    'manage_students','manage_classes','manage_subjects',
    'manage_teachers','manage_enrollments','manage_assignments',
    'manage_scores','lock_scores','approve_score_changes',
    'view_reports','manage_parameters'
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER'
  AND p.action IN ('view_reports');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'TEACHER'
  AND p.action IN ('manage_scores','view_homeroom_class','view_reports');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'STUDENT'
  AND p.action IN ('view_own_scores');

-- ==========================================
-- 4. GRADE LEVELS
-- ==========================================
INSERT INTO grade_levels (name, level, is_active) VALUES
  ('Khối 10', 10, true),
  ('Khối 11', 11, true),
  ('Khối 12', 12, true);

-- ==========================================
-- 5. SUBJECTS
-- ==========================================
INSERT INTO subjects (subject_code, name, coefficient, is_active) VALUES
  ('TOAN', 'Toán',        2, true),
  ('VAN',  'Ngữ Văn',     2, true),
  ('ANH',  'Tiếng Anh',   1, true),
  ('LY',   'Vật Lý',      1, true),
  ('HOA',  'Hóa Học',     1, true),
  ('SINH', 'Sinh Học',    1, true),
  ('SU',   'Lịch Sử',     1, true),
  ('DIA',  'Địa Lý',      1, true),
  ('TIN',  'Tin Học',     1, true),
  ('GDCD', 'GDCD',        1, true),
  ('TDUC', 'Thể Dục',     1, true);

-- ==========================================
-- 6. TEACHERS
-- ==========================================
INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV001', 'Nguyễn Văn An',  'an.nguyen@school.edu.vn',  '0901000001', id, 'ACTIVE'
FROM subjects WHERE subject_code = 'TOAN';

INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV002', 'Trần Thị Bình',  'binh.tran@school.edu.vn',  '0901000002', id, 'ACTIVE'
FROM subjects WHERE subject_code = 'VAN';

INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV003', 'Lê Văn Cường',   'cuong.le@school.edu.vn',   '0901000003', id, 'ACTIVE'
FROM subjects WHERE subject_code = 'ANH';

INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV004', 'Phạm Thị Dung',  'dung.pham@school.edu.vn',  '0901000004', id, 'ACTIVE'
FROM subjects WHERE subject_code = 'LY';

-- ==========================================
-- 7. SCHOOL YEAR + SEMESTERS
-- ==========================================
INSERT INTO school_years (name, start_year, end_year, start_date, end_date, is_active) VALUES
  ('2024-2025', 2024, 2025, '2024-09-05', '2025-05-31', true);

INSERT INTO semesters (name, start_date, end_date, is_active, school_year_id)
SELECT 'Học kỳ I', '2024-09-05', '2025-01-15', false, id
FROM school_years WHERE name = '2024-2025';

INSERT INTO semesters (name, start_date, end_date, is_active, school_year_id)
SELECT 'Học kỳ II', '2025-01-20', '2025-05-31', true, id
FROM school_years WHERE name = '2024-2025';

-- ==========================================
-- 8. SYSTEM PARAMETERS
-- ==========================================
INSERT INTO system_parameters (
  school_year_id, min_age, max_age, max_class_size,
  min_score, max_score, subject_pass_score, semester_pass_score,
  effective_from, effective_to
)
SELECT id, 15, 20, 40, 0, 10, 5.0, 5.0, '2024-09-05', NULL
FROM school_years WHERE name = '2024-2025';

-- ==========================================
-- 9. TEST TYPES
-- ==========================================
INSERT INTO test_types (code, name, default_weight, is_multiple) VALUES
  ('TX', 'Thường xuyên (Miệng/15 phút)', 1, true),
  ('GK', 'Giữa kỳ (1 tiết)',             2, true),
  ('CK', 'Cuối kỳ',                       3, false);

-- ==========================================
-- 10. SCORE WEIGHTS
-- ==========================================
INSERT INTO score_weights (school_year_id, test_type_id, weight, effective_from)
SELECT sy.id, tt.id, tt.default_weight, '2024-09-05'
FROM school_years sy, test_types tt
WHERE sy.name = '2024-2025';

-- ==========================================
-- 11. CLASSES
-- ==========================================
INSERT INTO classes (class_code, name, max_size, current_size, status, grade_level_id, school_year_id, homeroom_teacher_id)
SELECT '10A1', '10A1', 40, 0, 'ACTIVE', gl.id, sy.id, t.id
FROM grade_levels gl, school_years sy, teachers t
WHERE gl.level = 10 AND sy.name = '2024-2025' AND t.teacher_code = 'GV001';

INSERT INTO classes (class_code, name, max_size, current_size, status, grade_level_id, school_year_id, homeroom_teacher_id)
SELECT '10A2', '10A2', 40, 0, 'ACTIVE', gl.id, sy.id, t.id
FROM grade_levels gl, school_years sy, teachers t
WHERE gl.level = 10 AND sy.name = '2024-2025' AND t.teacher_code = 'GV002';

INSERT INTO classes (class_code, name, max_size, current_size, status, grade_level_id, school_year_id, homeroom_teacher_id)
SELECT '11A1', '11A1', 40, 0, 'ACTIVE', gl.id, sy.id, t.id
FROM grade_levels gl, school_years sy, teachers t
WHERE gl.level = 11 AND sy.name = '2024-2025' AND t.teacher_code = 'GV003';

INSERT INTO classes (class_code, name, max_size, current_size, status, grade_level_id, school_year_id, homeroom_teacher_id)
SELECT '12A1', '12A1', 40, 0, 'ACTIVE', gl.id, sy.id, t.id
FROM grade_levels gl, school_years sy, teachers t
WHERE gl.level = 12 AND sy.name = '2024-2025' AND t.teacher_code = 'GV004';

-- ==========================================
-- 12. STUDENTS
-- ==========================================
INSERT INTO students (student_code, full_name, gender, date_of_birth, address, email, admission_date, status) VALUES
  ('HS001', 'Nguyễn Minh Anh',  'Nam', '2009-03-15', 'Q1, TP.HCM',  'anh.nguyen@student.edu.vn',  '2024-09-05', 'ACTIVE'),
  ('HS002', 'Trần Thị Bảo',     'Nữ',  '2009-07-22', 'Q3, TP.HCM',  'bao.tran@student.edu.vn',    '2024-09-05', 'ACTIVE'),
  ('HS003', 'Lê Hoàng Cát',     'Nam', '2009-01-10', 'Q5, TP.HCM',  'cat.le@student.edu.vn',      '2024-09-05', 'ACTIVE'),
  ('HS004', 'Phạm Ngọc Duy',    'Nam', '2009-11-30', 'Q7, TP.HCM',  'duy.pham@student.edu.vn',    '2024-09-05', 'ACTIVE'),
  ('HS005', 'Hoàng Thị Én',     'Nữ',  '2009-05-18', 'Q10, TP.HCM', 'en.hoang@student.edu.vn',    '2024-09-05', 'ACTIVE'),
  ('HS006', 'Vũ Quang Phát',    'Nam', '2009-08-25', 'Bình Thạnh',  'phat.vu@student.edu.vn',     '2024-09-05', 'ACTIVE'),
  ('HS007', 'Đặng Thị Giang',   'Nữ',  '2009-02-14', 'Gò Vấp',      'giang.dang@student.edu.vn',  '2024-09-05', 'ACTIVE'),
  ('HS008', 'Bùi Văn Hùng',     'Nam', '2009-09-09', 'Tân Bình',    'hung.bui@student.edu.vn',    '2024-09-05', 'ACTIVE'),
  ('HS009', 'Đinh Thị Iris',    'Nữ',  '2009-04-20', 'Phú Nhuận',   'iris.dinh@student.edu.vn',   '2024-09-05', 'ACTIVE'),
  ('HS010', 'Ngô Minh Khoa',    'Nam', '2009-12-05', 'Bình Tân',    'khoa.ngo@student.edu.vn',    '2024-09-05', 'ACTIVE');

-- ==========================================
-- 13. USERS
-- ==========================================
INSERT INTO users (username, email, password_hash, full_name, status, role_id) VALUES
  ('admin',
   'admin@school.edu.vn',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Quản Trị Viên',
   'ACTIVE',
   (SELECT id FROM roles WHERE name = 'ADMIN')),
  ('giaovu01',
   'giaovu01@school.edu.vn',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Nguyễn Thị Giáo Vụ',
   'ACTIVE',
   (SELECT id FROM roles WHERE name = 'ACADEMIC_STAFF')),
  ('manager01',
   'manager01@school.edu.vn',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Trần Văn Hiệu Trưởng',
   'ACTIVE',
   (SELECT id FROM roles WHERE name = 'MANAGER'));

-- teacher01
INSERT INTO users (username, email, password_hash, full_name, status, role_id, teacher_id)
SELECT 'teacher01', t.email,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  t.full_name, 'ACTIVE',
  (SELECT id FROM roles WHERE name = 'TEACHER'), t.id
FROM teachers t WHERE t.teacher_code = 'GV001';

-- teacher02
INSERT INTO users (username, email, password_hash, full_name, status, role_id, teacher_id)
SELECT 'teacher02', t.email,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  t.full_name, 'ACTIVE',
  (SELECT id FROM roles WHERE name = 'TEACHER'), t.id
FROM teachers t WHERE t.teacher_code = 'GV002';

-- student01 (HS001)
INSERT INTO users (username, email, password_hash, full_name, status, role_id, student_id)
SELECT 'student01', s.email,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  s.full_name, 'ACTIVE',
  (SELECT id FROM roles WHERE name = 'STUDENT'), s.id
FROM students s WHERE s.student_code = 'HS001';

-- ==========================================
-- 14. STUDENT CLASS ENROLLMENTS (Học kỳ I)
-- ==========================================
INSERT INTO student_class_enrollments (student_id, class_id, semester_id, status)
SELECT s.id, c.id, sem.id, 'ACTIVE'
FROM students s, classes c, semesters sem
WHERE c.class_code = '10A1'
  AND sem.name = 'Học kỳ I'
  AND s.student_code IN ('HS001','HS002','HS003','HS004','HS005');

INSERT INTO student_class_enrollments (student_id, class_id, semester_id, status)
SELECT s.id, c.id, sem.id, 'ACTIVE'
FROM students s, classes c, semesters sem
WHERE c.class_code = '10A2'
  AND sem.name = 'Học kỳ I'
  AND s.student_code IN ('HS006','HS007','HS008','HS009','HS010');

UPDATE classes SET current_size = 5 WHERE class_code IN ('10A1','10A2');

-- ==========================================
-- 15. TEACHER ASSIGNMENTS
-- ==========================================
-- HOMEROOM: teacher01 -> 10A1 (cả năm, không gắn semester)
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, semester_id, assignment_type)
SELECT t.id, c.id, NULL, NULL, 'HOMEROOM'
FROM teachers t, classes c
WHERE t.teacher_code = 'GV001' AND c.class_code = '10A1';

-- SUBJECT: teacher01 -> Toán 10A1 HK1
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, semester_id, assignment_type)
SELECT t.id, c.id, s.id, sem.id, 'SUBJECT'
FROM teachers t, classes c, subjects s, semesters sem
WHERE t.teacher_code = 'GV001'
  AND c.class_code = '10A1'
  AND s.subject_code = 'TOAN'
  AND sem.name = 'Học kỳ I';

-- SUBJECT: teacher02 -> Văn 10A1 HK1
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, semester_id, assignment_type)
SELECT t.id, c.id, s.id, sem.id, 'SUBJECT'
FROM teachers t, classes c, subjects s, semesters sem
WHERE t.teacher_code = 'GV002'
  AND c.class_code = '10A1'
  AND s.subject_code = 'VAN'
  AND sem.name = 'Học kỳ I';

-- ==========================================
-- 16. SCORE SHEET MẪU (Toán 10A1 HK1 - DRAFT)
-- ==========================================
INSERT INTO score_sheets (class_id, subject_id, semester_id, status)
SELECT c.id, s.id, sem.id, 'DRAFT'
FROM classes c, subjects s, semesters sem
WHERE c.class_code = '10A1'
  AND s.subject_code = 'TOAN'
  AND sem.name = 'Học kỳ I';

INSERT INTO student_subject_scores (score_sheet_id, student_id)
SELECT ss.id, sce.student_id
FROM score_sheets ss
JOIN classes c ON ss.class_id = c.id
JOIN semesters sem ON ss.semester_id = sem.id
JOIN subjects sub ON ss.subject_id = sub.id
JOIN student_class_enrollments sce ON sce.class_id = c.id AND sce.semester_id = sem.id
WHERE c.class_code = '10A1'
  AND sub.subject_code = 'TOAN'
  AND sem.name = 'Học kỳ I';