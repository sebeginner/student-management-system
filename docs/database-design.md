# Database Design - Thiết kế dữ liệu hệ thống Quản lý học sinh

Tài liệu này mô tả thiết kế dữ liệu mức logic, bám theo `backend/prisma/schema.prisma`.

## 1. Nhóm bảng tài khoản và phân quyền

| Model | Table | Mục đích |
|---|---|---|
| `Role` | `roles` | Lưu vai trò người dùng: ADMIN, TEACHER, STUDENT |
| `Permission` | `permissions` | Lưu quyền thao tác |
| `RolePermission` | `role_permissions` | Bảng trung gian role - permission |
| `User` | `users` | Lưu tài khoản đăng nhập |
| `AuditLog` | `audit_logs` | Lưu nhật ký thao tác quan trọng |

### User

Trường chính:

- `id`
- `username`
- `email`
- `passwordHash`
- `fullName`
- `status`
- `roleId`
- `studentId`
- `teacherId`

Quan hệ:

- User thuộc một Role.
- User có thể liên kết với Student hoặc Teacher.

## 2. Nhóm bảng học vụ

| Model | Table | Mục đích |
|---|---|---|
| `Student` | `students` | Hồ sơ học sinh |
| `Teacher` | `teachers` | Hồ sơ giáo viên |
| `SchoolYear` | `school_years` | Năm học |
| `Semester` | `semesters` | Học kỳ |
| `GradeLevel` | `grade_levels` | Khối lớp |
| `Class` | `classes` | Lớp học |
| `StudentClassEnrollment` | `student_class_enrollments` | Phân học sinh vào lớp theo học kỳ |
| `Subject` | `subjects` | Môn học |
| `TeacherAssignment` | `teacher_assignments` | Phân công giáo viên |

## 3. Nhóm bảng điểm

| Model | Table | Mục đích |
|---|---|---|
| `TestType` | `test_types` | Loại hình kiểm tra: miệng, 1 tiết, giữa kỳ, cuối kỳ |
| `ScoreWeight` | `score_weights` | Hệ số điểm theo năm học |
| `ScoreSheet` | `score_sheets` | Bảng điểm của một lớp - môn - học kỳ |
| `StudentSubjectScore` | `student_subject_scores` | Điểm tổng hợp của từng học sinh trong bảng điểm |
| `ScoreDetail` | `score_details` | Điểm chi tiết theo loại kiểm tra/lần kiểm tra |

## 4. Nhóm bảng báo cáo

| Model | Table | Mục đích |
|---|---|---|
| `SubjectReport` | `subject_reports` | Báo cáo tổng kết môn |
| `SubjectReportDetail` | `subject_report_details` | Chi tiết báo cáo môn theo lớp |
| `SemesterReport` | `semester_reports` | Báo cáo tổng kết học kỳ |
| `SemesterReportDetail` | `semester_report_details` | Chi tiết báo cáo học kỳ theo lớp |

Trong MVP, báo cáo có thể tính động bằng query thay vì bắt buộc lưu vào các bảng report.

## 5. Nhóm bảng tham số hệ thống

| Model | Table | Mục đích |
|---|---|---|
| `SystemParameter` | `system_parameters` | Lưu tham số tuổi, sĩ số, điểm, điểm đạt theo năm học |

Trường chính:

- `schoolYearId`
- `minAge`
- `maxAge`
- `maxClassSize`
- `minScore`
- `maxScore`
- `subjectPassScore`
- `semesterPassScore`
- `effectiveFrom`
- `effectiveTo`

## 6. Ràng buộc quan trọng

| Ràng buộc | Ý nghĩa |
|---|---|
| `Student.studentCode` unique | Không trùng mã học sinh |
| `Teacher.teacherCode` unique | Không trùng mã giáo viên |
| `User.username` unique | Không trùng tên đăng nhập |
| `User.email` unique | Không trùng email |
| `Class.classCode` unique | Không trùng mã lớp |
| `Class(schoolYearId, name)` unique | Không trùng tên lớp trong cùng năm học |
| `Semester(schoolYearId, name)` unique | Không trùng học kỳ trong cùng năm học |
| `StudentClassEnrollment(studentId, semesterId)` unique | Một học sinh chỉ thuộc một lớp trong một học kỳ |
| `TeacherAssignment(teacherId, classId, subjectId, semesterId)` unique | Tránh phân công trùng |
| `ScoreSheet(classId, subjectId, semesterId)` unique | Một lớp chỉ có một bảng điểm cho một môn/học kỳ |
| `StudentSubjectScore(scoreSheetId, studentId)` unique | Mỗi học sinh chỉ có một dòng điểm trong bảng điểm |
| `ScoreDetail(studentSubjectScoreId, testTypeId, attemptNo)` unique | Tránh trùng điểm cùng loại/lần |

## 7. Mapping nghiệp vụ sang dữ liệu

| Nghiệp vụ | Bảng liên quan |
|---|---|
| Đăng nhập | `users`, `roles`, `permissions` |
| Tiếp nhận học sinh | `students`, `system_parameters` |
| Lập danh sách lớp | `classes`, `students`, `student_class_enrollments`, `semesters` |
| Nhập điểm | `score_sheets`, `student_subject_scores`, `score_details`, `test_types`, `score_weights` |
| Tra cứu điểm | `students`, `score_sheets`, `student_subject_scores`, `score_details`, `subjects`, `semesters` |
| Báo cáo môn | `score_sheets`, `student_subject_scores`, `classes`, `subjects`, `system_parameters` |
| Báo cáo học kỳ | `student_class_enrollments`, `student_subject_scores`, `classes`, `semesters`, `system_parameters` |
| Thay đổi quy định | `system_parameters`, `subjects`, `grade_levels`, `classes`, `semesters` |

## 8. Dữ liệu seed tối thiểu

Cần seed ít nhất:

- Roles: ADMIN, TEACHER, STUDENT.
- Users demo: admin, teacher01, student01.
- SchoolYear: 2025-2026.
- Semesters: HK1, HK2.
- GradeLevels: 10, 11, 12.
- Classes: 10A1, 10A2, 11A1, 12A1.
- Subjects: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa.
- TestTypes: ORAL_15M, ONE_PERIOD, MIDTERM, FINAL.
- SystemParameter: minAge 15, maxAge 20, maxClassSize 40, minScore 0, maxScore 10, subjectPassScore 5, semesterPassScore 5.
