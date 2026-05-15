-- ==========================================
-- SEED DATA - Student Management System
-- PostgreSQL
-- ==========================================

-- Xóa dữ liệu cũ theo thứ tự ngược (tránh lỗi foreign key)
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
  ('MANAGER'),
  ('TEACHER'),
  ('STUDENT');

-- ==========================================
-- 2. PERMISSIONS
-- ==========================================
INSERT INTO permissions (action) VALUES
  ('manage_users'),
  ('manage_students'),
  ('manage_classes'),
  ('manage_subjects'),
  ('manage_scores'),
  ('view_reports'),
  ('manage_parameters'),
  ('view_scores');

-- ==========================================
-- 3. ROLE_PERMISSIONS
-- ==========================================
-- ADMIN: tất cả quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN';

-- MANAGER: quản lý học vụ + xem báo cáo
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER'
  AND p.action IN ('manage_students','manage_classes','manage_subjects','view_reports','manage_parameters');

-- TEACHER: quản lý điểm
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'TEACHER'
  AND p.action IN ('manage_scores','view_reports');

-- STUDENT: chỉ xem điểm
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'STUDENT'
  AND p.action IN ('view_scores');

-- ==========================================
-- 4. GRADE LEVELS (Khối lớp)
-- ==========================================
INSERT INTO grade_levels (name, level, is_active) VALUES
  ('Khối 10', 10, true),
  ('Khối 11', 11, true),
  ('Khối 12', 12, true);

-- ==========================================
-- 5. SUBJECTS (Môn học)
-- ==========================================
INSERT INTO subjects (subject_code, name, coefficient, is_active) VALUES
  ('TOAN',  'Toán',           2, true),
  ('VAN',   'Ngữ Văn',        2, true),
  ('ANH',   'Tiếng Anh',      1, true),
  ('LY',    'Vật Lý',         1, true),
  ('HOA',   'Hóa Học',        1, true),
  ('SINH',  'Sinh Học',       1, true),
  ('SU',    'Lịch Sử',        1, true),
  ('DIA',   'Địa Lý',         1, true),
  ('TIN',   'Tin Học',        1, true),
  ('GDCD',  'GDCD',           1, true);

-- ==========================================
-- 6. TEACHERS
-- ==========================================
INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV001', 'Nguyễn Văn An',   'an.nguyen@school.edu.vn',   '0901000001', id, 'ACTIVE' FROM subjects WHERE subject_code = 'TOAN';
INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV002', 'Trần Thị Bình',   'binh.tran@school.edu.vn',   '0901000002', id, 'ACTIVE' FROM subjects WHERE subject_code = 'VAN';
INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV003', 'Lê Văn Cường',    'cuong.le@school.edu.vn',    '0901000003', id, 'ACTIVE' FROM subjects WHERE subject_code = 'ANH';
INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV004', 'Phạm Thị Dung',   'dung.pham@school.edu.vn',   '0901000004', id, 'ACTIVE' FROM subjects WHERE subject_code = 'LY';
INSERT INTO teachers (teacher_code, full_name, email, phone, subject_id, status)
SELECT 'GV005', 'Hoàng Văn Em',    'em.hoang@school.edu.vn',    '0901000005', id, 'ACTIVE' FROM subjects WHERE subject_code = 'HOA';

-- ==========================================
-- 7. SCHOOL YEAR + SEMESTERS
-- ==========================================
INSERT INTO school_years (name, start_year, end_year, start_date, end_date, is_active) VALUES
  ('2024-2025', 2024, 2025, '2024-09-05', '2025-05-31', true);

INSERT INTO semesters (name, start_date, end_date, is_active, school_year_id)
SELECT 'Học kỳ I',  '2024-09-05', '2025-01-15', false, id FROM school_years WHERE name = '2024-2025';
INSERT INTO semesters (name, start_date, end_date, is_active, school_year_id)
SELECT 'Học kỳ II', '2025-01-20', '2025-05-31', true,  id FROM school_years WHERE name = '2024-2025';

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
-- 9. TEST TYPES (Loại bài kiểm tra)
-- ==========================================
INSERT INTO test_types (code, name, default_weight, is_multiple) VALUES
  ('TX',  'Điểm thường xuyên', 1, true),
  ('GK',  'Giữa kỳ',           2, false),
  ('CK',  'Cuối kỳ',           3, false);

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
  ('HS001', 'Nguyễn Minh Anh',   'Nam', '2009-03-15', 'Q1, TP.HCM',  'anh.nguyen@student.edu.vn',   '2024-09-05', 'ACTIVE'),
  ('HS002', 'Trần Thị Bảo',      'Nữ',  '2009-07-22', 'Q3, TP.HCM',  'bao.tran@student.edu.vn',     '2024-09-05', 'ACTIVE'),
  ('HS003', 'Lê Hoàng Cát',      'Nam', '2009-01-10', 'Q5, TP.HCM',  'cat.le@student.edu.vn',       '2024-09-05', 'ACTIVE'),
  ('HS004', 'Phạm Ngọc Duy',     'Nam', '2009-11-30', 'Q7, TP.HCM',  'duy.pham@student.edu.vn',     '2024-09-05', 'ACTIVE'),
  ('HS005', 'Hoàng Thị Én',      'Nữ',  '2009-05-18', 'Q10, TP.HCM', 'en.hoang@student.edu.vn',     '2024-09-05', 'ACTIVE'),
  ('HS006', 'Vũ Quang Phát',     'Nam', '2009-08-25', 'Bình Thạnh',  'phat.vu@student.edu.vn',      '2024-09-05', 'ACTIVE'),
  ('HS007', 'Đặng Thị Giang',    'Nữ',  '2009-02-14', 'Gò Vấp',      'giang.dang@student.edu.vn',   '2024-09-05', 'ACTIVE'),
  ('HS008', 'Bùi Văn Hùng',      'Nam', '2009-09-09', 'Tân Bình',    'hung.bui@student.edu.vn',     '2024-09-05', 'ACTIVE'),
  ('HS009', 'Đinh Thị Iris',     'Nữ',  '2009-04-20', 'Phú Nhuận',   'iris.dinh@student.edu.vn',    '2024-09-05', 'ACTIVE'),
  ('HS010', 'Ngô Minh Khoa',     'Nam', '2009-12-05', 'Q.Bình Tân',  'khoa.ngo@student.edu.vn',     '2024-09-05', 'ACTIVE');

-- ==========================================
-- 13. USERS
-- ==========================================
-- Mật khẩu mẫu đều là: Password123! (đã hash bằng bcrypt, 10 rounds)
-- Hash: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (username, email, password_hash, full_name, status, role_id) VALUES
  ('admin',   'admin@school.edu.vn',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản Trị Viên', 'ACTIVE', (SELECT id FROM roles WHERE name = 'ADMIN')),
  ('manager', 'manager@school.edu.vn', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản Lý Học Vụ','ACTIVE', (SELECT id FROM roles WHERE name = 'MANAGER'));

-- Users cho Teachers
INSERT INTO users (username, email, password_hash, full_name, status, role_id, teacher_id)
SELECT
  'gv00' || t.id,
  t.email,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  t.full_name,
  'ACTIVE',
  (SELECT id FROM roles WHERE name = 'TEACHER'),
  t.id
FROM teachers t;

-- Users cho Students
INSERT INTO users (username, email, password_hash, full_name, status, role_id, student_id)
SELECT
  lower(replace(s.student_code, 'HS', 'hs')),
  s.email,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  s.full_name,
  'ACTIVE',
  (SELECT id FROM roles WHERE name = 'STUDENT'),
  s.id
FROM students s;

-- ==========================================
-- 14. STUDENT CLASS ENROLLMENTS
-- (Xếp học sinh vào lớp 10A1 cho học kỳ II)
-- ==========================================
INSERT INTO student_class_enrollments (student_id, class_id, semester_id, status)
SELECT s.id, c.id, sem.id, 'ACTIVE'
FROM students s, classes c, semesters sem
WHERE c.class_code = '10A1'
  AND sem.name = 'Học kỳ II'
  AND s.student_code IN ('HS001','HS002','HS003','HS004','HS005');

INSERT INTO student_class_enrollments (student_id, class_id, semester_id, status)
SELECT s.id, c.id, sem.id, 'ACTIVE'
FROM students s, classes c, semesters sem
WHERE c.class_code = '10A2'
  AND sem.name = 'Học kỳ II'
  AND s.student_code IN ('HS006','HS007','HS008','HS009','HS010');

-- Cập nhật current_size cho các lớp
UPDATE classes SET current_size = 5 WHERE class_code IN ('10A1', '10A2');

-- ==========================================
-- 15. TEACHER ASSIGNMENTS
-- (Phân công giáo viên dạy môn)
-- ==========================================
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, semester_id, assignment_type)
SELECT t.id, c.id, s.id, sem.id, 'MAIN'
FROM teachers t, classes c, subjects s, semesters sem
WHERE t.teacher_code = 'GV001' AND c.class_code = '10A1'
  AND s.subject_code = 'TOAN' AND sem.name = 'Học kỳ II';

INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, semester_id, assignment_type)
SELECT t.id, c.id, s.id, sem.id, 'MAIN'
FROM teachers t, classes c, subjects s, semesters sem
WHERE t.teacher_code = 'GV002' AND c.class_code = '10A1'
  AND s.subject_code = 'VAN' AND sem.name = 'Học kỳ II';

INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, semester_id, assignment_type)
SELECT t.id, c.id, s.id, sem.id, 'MAIN'
FROM teachers t, classes c, subjects s, semesters sem
WHERE t.teacher_code = 'GV003' AND c.class_code = '10A1'
  AND s.subject_code = 'ANH' AND sem.name = 'Học kỳ II';

-- ==========================================
-- THÔNG TIN TÀI KHOẢN DEMO
-- ==========================================
-- admin     / Password123!  -> Role: ADMIN
-- manager   / Password123!  -> Role: MANAGER
-- gv001     / Password123!  -> Role: TEACHER (Toán)
-- gv002     / Password123!  -> Role: TEACHER (Văn)
-- hs001     / Password123!  -> Role: STUDENT (Nguyễn Minh Anh)
-- hs002     / Password123!  -> Role: STUDENT (Trần Thị Bảo)