# Database Design — Thiết kế dữ liệu hệ thống Quản lý học sinh SE104

Tài liệu này mô tả thiết kế dữ liệu logic, bám theo `backend/prisma/schema.prisma`.

---

## 1. Nhóm 1 — Tài khoản và phân quyền

| Model | Table | Mục đích |
|---|---|---|
| `Role` | `roles` | Vai trò: ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER, STUDENT |
| `Permission` | `permissions` | Quyền thao tác cụ thể |
| `RolePermission` | `role_permissions` | Bảng trung gian role ↔ permission |
| `User` | `users` | Tài khoản đăng nhập |
| `AuditLog` | `audit_logs` | Nhật ký thao tác quan trọng |

### User

Trường chính: `id`, `username` (unique), `email` (unique), `passwordHash`, `fullName`, `status`, `roleId`, `studentId` (unique, nullable), `teacherId` (unique, nullable).

Quan hệ: User thuộc một Role; có thể liên kết với `Student` hoặc `Teacher`.

---

## 2. Nhóm 2 — Quản lý học vụ

| Model | Table | Mục đích |
|---|---|---|
| `Student` | `students` | Hồ sơ học sinh |
| `Teacher` | `teachers` | Hồ sơ giáo viên (có trường `subjectId` — chuyên môn) |
| `SchoolYear` | `school_years` | Năm học |
| `Semester` | `semesters` | Học kỳ (gắn với `SchoolYear`) |
| `GradeLevel` | `grade_levels` | Khối lớp (10, 11, 12) |
| `Class` | `classes` | Lớp học theo năm học |
| `StudentClassEnrollment` | `student_class_enrollments` | Học sinh thuộc lớp nào trong học kỳ nào |
| `Subject` | `subjects` | Môn học |
| `TeacherAssignment` | `teacher_assignments` | Phân công GVCN hoặc GVBM |

### TeacherAssignment

Enum `TeacherAssignmentType`:

| Loại | subjectId | semesterId | Ý nghĩa |
|---|---|---|---|
| `HOMEROOM` | `null` | `null` | GVCN — áp dụng cả năm học |
| `SUBJECT` | bắt buộc | bắt buộc | GVBM — gắn với lớp/môn/học kỳ |

`isActive` dùng để phân biệt phân công hiện hành với lịch sử (không xóa cứng).

### GradeLevel

Trường `level` có ràng buộc `@unique` — đảm bảo không có hai khối trùng số (ví dụ không thể có hai khối 10).

---

## 3. Nhóm 3 — Điểm số

| Model | Table | Mục đích |
|---|---|---|
| `TestType` | `test_types` | Loại kiểm tra: ORAL_15M, ONE_PERIOD, MIDTERM, FINAL |
| `ScoreWeight` | `score_weights` | Hệ số điểm theo năm học (dùng để override mặc định) |
| `ScoreSheet` | `score_sheets` | Bảng điểm của một lớp–môn–học kỳ |
| `StudentSubjectScore` | `student_subject_scores` | Điểm tổng hợp của học sinh trong bảng điểm |
| `ScoreDetail` | `score_details` | Điểm chi tiết từng lần kiểm tra |
| `ScoreChangeRequest` | `score_change_requests` | Yêu cầu sửa điểm sau khi bảng điểm LOCKED |

`ScoreSheet.status` dùng enum `ScoreSheetStatus`: `DRAFT | SUBMITTED | LOCKED | NEEDS_CORRECTION`.

---

## 4. Nhóm 4 — Báo cáo tổng kết

| Model | Table | Mục đích |
|---|---|---|
| `SubjectReport` | `subject_reports` | Báo cáo tổng kết môn |
| `SubjectReportDetail` | `subject_report_details` | Chi tiết báo cáo môn theo lớp |
| `SemesterReport` | `semester_reports` | Báo cáo tổng kết học kỳ |
| `SemesterReportDetail` | `semester_report_details` | Chi tiết báo cáo học kỳ theo lớp |

Trong MVP, báo cáo có thể tính động bằng query thay vì bắt buộc lưu vào các bảng này.

---

## 5. Nhóm 5 — Tham số hệ thống

| Model | Table | Mục đích |
|---|---|---|
| `SystemParameter` | `system_parameters` | Tham số tuổi, sĩ số, điểm, điểm đạt theo năm học |

Trường chính: `schoolYearId` (unique — mỗi năm học một bộ tham số), `minAge`, `maxAge`, `maxClassSize`, `minScore`, `maxScore`, `subjectPassScore`, `semesterPassScore`, `effectiveFrom`, `effectiveTo`.

---

## 6. Nhóm 6 — Kết quả học kỳ và tổng kết năm (UC2)

| Model | Table | Mục đích |
|---|---|---|
| `SemesterStudentResult` | `semester_student_results` | Kết quả học kỳ đã chốt của học sinh |
| `YearEndResult` | `year_end_results` | Kết quả tổng kết năm và quyết định lên lớp |

### SemesterStudentResult

Trường chính: `studentId`, `semesterId`, `classId`, `semesterAverage`, `academicRating` (EXCELLENT/GOOD/AVERAGE/WEAK/POOR), `subjectCount`, `failedSubjectCount`, `finalizedAt`, `finalizedById`.

Unique: `[studentId, semesterId]`.

### YearEndResult

Trường chính: `studentId`, `schoolYearId`, `classId`, `hk1Average`, `hk2Average`, `yearAverage`, `academicRating`, `conductRating`, `decision` (ADVANCE/REMEDIAL/CONDUCT_REVIEW/RETAIN), `decisionNote`.

Unique: `[studentId, schoolYearId]`.

---

## 7. Nhóm 7 — Hạnh kiểm (UC1)

| Model | Table | Mục đích |
|---|---|---|
| `ConductAssessment` | `conduct_assessments` | Phiếu hạnh kiểm của học sinh theo học kỳ |
| `ConductCriterion` | `conduct_criteria` | Chi tiết đánh giá từng tiêu chí |

### ConductAssessment

Trường chính: `studentId`, `semesterId`, `classId`, `status` (DRAFT/SUBMITTED/FINALIZED), `finalRating` (EXCELLENT/GOOD/AVERAGE/WEAK), `teacherNote`, `reviewNote`, `submittedById`, `reviewedById`.

Unique: `[studentId, semesterId]`.

### ConductCriterion

`code`: `ATTENDANCE | DISCIPLINE | ACADEMIC | ACTIVITIES`  
`rating`: `EXCELLENT | GOOD | AVERAGE | WEAK`

---

## 8. Nhóm 8 — Thời khóa biểu (UC5)

| Model | Table | Mục đích |
|---|---|---|
| `TimetableSlot` | `timetable_slots` | Một tiết học trong thời khóa biểu |

Trường chính: `semesterId`, `classId`, `subjectId`, `teacherId`, `dayOfWeek` (1=T2…6=T7), `period` (1–5), `room`.

Ràng buộc unique:
- `(semesterId, classId, dayOfWeek, period)` — tên `unique_class_slot`: một lớp không có hai môn cùng tiết.
- `(semesterId, teacherId, dayOfWeek, period)` — tên `unique_teacher_slot`: một GV không dạy hai lớp cùng tiết.

---

## 9. Ràng buộc quan trọng

| Ràng buộc | Ý nghĩa |
|---|---|
| `Student.studentCode` unique | Không trùng mã học sinh |
| `Teacher.teacherCode` unique | Không trùng mã giáo viên |
| `User.username` unique | Không trùng tên đăng nhập |
| `User.email` unique | Không trùng email |
| `GradeLevel.level` unique | Không trùng số khối (10, 11, 12) |
| `Class.classCode` unique | Không trùng mã lớp |
| `Class(schoolYearId, name)` unique | Không trùng tên lớp trong cùng năm học |
| `Semester(schoolYearId, name)` unique | Không trùng tên học kỳ trong cùng năm học |
| `StudentClassEnrollment`: index `[studentId, semesterId, status]` | Dùng để kiểm tra unique enrollment active |
| `TeacherAssignment` partial unique indexes | Một lớp chỉ có một GVCN; một lớp/môn/HK chỉ có một GVBM |
| `ScoreSheet(classId, subjectId, semesterId)` unique | Mỗi lớp một bảng điểm cho mỗi môn/HK |
| `StudentSubjectScore(scoreSheetId, studentId)` unique | Mỗi HS một dòng điểm trong bảng |
| `ScoreDetail(studentSubjectScoreId, testTypeId, attemptNo)` unique | Không trùng điểm cùng loại/lần |
| `ConductAssessment(studentId, semesterId)` unique | Mỗi HS một phiếu hạnh kiểm/HK |
| `SemesterStudentResult(studentId, semesterId)` unique | Mỗi HS một kết quả HK |
| `YearEndResult(studentId, schoolYearId)` unique | Mỗi HS một kết quả năm |
| `TimetableSlot unique_class_slot` | Mỗi lớp không trùng tiết học |
| `TimetableSlot unique_teacher_slot` | Mỗi GV không trùng tiết dạy |

---

## 10. Mapping nghiệp vụ sang dữ liệu

| Nghiệp vụ | Bảng chính liên quan |
|---|---|
| Đăng nhập | `users`, `roles` |
| Tiếp nhận học sinh | `students`, `system_parameters` |
| Phân lớp / chuyển lớp | `student_class_enrollments`, `classes`, `semesters` |
| Phân công GVCN/GVBM | `teacher_assignments`, `teachers`, `subjects`, `semesters` |
| Nhập điểm | `score_sheets`, `student_subject_scores`, `score_details`, `test_types` |
| Yêu cầu sửa điểm | `score_change_requests`, `score_sheets`, `student_subject_scores` |
| Tra cứu điểm | `student_subject_scores`, `score_details`, `score_sheets` |
| Báo cáo môn | `subject_report_details`, `student_subject_scores` |
| Báo cáo học kỳ | `semester_student_results`, `classes` |
| Tổng kết năm học | `year_end_results`, `semester_student_results` |
| Hạnh kiểm | `conduct_assessments`, `conduct_criteria` |
| Thời khóa biểu | `timetable_slots`, `teacher_assignments` |
| Nhật ký | `audit_logs`, `users` |
| Tham số | `system_parameters`, `school_years` |

---

## 11. Dữ liệu seed thực tế

| Loại | Dữ liệu |
|---|---|
| Roles | ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER, STUDENT |
| Users | admin, giaovu01, manager01, teacher01–05, student01–07 (student06 chờ lớp) |
| SchoolYear | `2025-2026` (isActive=true) |
| Semesters | HK1 (isActive=false), HK2 (isActive=true) |
| GradeLevels | 10, 11, 12 |
| Classes | 10A1(20hs), 10A2(15hs), 11A1(15hs), 11A2(12hs, chưa có GVCN), 12A1(8hs) |
| Subjects | Toán(MATH), Ngữ văn(LIT), Tiếng Anh(ENG), Vật lý(PHY), Hóa học(CHEM) |
| TestTypes | ORAL_15M(×1), ONE_PERIOD(×2), MIDTERM(×3), FINAL(×3) |
| SystemParameter | minAge=15, maxAge=20, maxClassSize=40, minScore=0, maxScore=10, subjectPassScore=5, semesterPassScore=5 |
| TeacherAssignments | HOMEROOM: T001→10A1, T002→10A2, T003→11A1, T004→12A1. SUBJECT: xem seed.ts §12 |
| ScoreSheets | HK1: nhiều LOCKED/SUBMITTED/DRAFT; HK2: 2 DRAFT |
| ScoreChangeRequests | 1 PENDING, 1 APPROVED |
| SemesterStudentResult | Đã chốt HK1 cho lớp 10A1 |
| ConductAssessments | 5 FINALIZED + 3 SUBMITTED cho lớp 10A1 HK1 |
| TimetableSlots | 11 tiết lớp 10A1 HK2 |
