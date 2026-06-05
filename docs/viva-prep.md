# VIVA PREP — Student Management System SE104

> Tài liệu ôn vấn đáp. Mọi thông tin dựa trên code thực tế trong repo.

---

## 1. Tổng quan hệ thống

### Hệ thống làm gì?

Hệ thống hỗ trợ một trường THPT số hóa toàn bộ quy trình học vụ:

- Quản lý học sinh, giáo viên, lớp học, môn học, năm học, học kỳ
- Phân học sinh vào lớp; phân công GVCN/GVBM cho giáo viên
- Nhập điểm → tính điểm trung bình → submit → khóa bảng điểm
- Yêu cầu sửa điểm sau khi bảng điểm đã khóa
- Chốt kết quả học kỳ; tổng kết năm học/xét lên lớp
- Đánh giá hạnh kiểm (4 tiêu chí); thời khóa biểu
- Import học sinh và điểm từ Excel; xuất PDF bảng điểm và phiếu điểm cá nhân
- Báo cáo tổng kết môn, học kỳ, dashboard
- Nhật ký hệ thống (audit log)
- Quản lý Năm học & Học kỳ qua UI (tạo, cập nhật, đặt active)
- Thông báo nội bộ: tạo theo phạm vi (toàn trường/role/lớp), badge chưa đọc, giới hạn lớp cho TEACHER

### Actor chính là ai?

| Role | Tên gọi | Quyền cốt lõi |
|---|---|---|
| `ADMIN` | Quản trị viên | Tài khoản, role, audit log, tham số |
| `ACADEMIC_STAFF` | Giáo vụ | Toàn quyền nghiệp vụ học vụ |
| `MANAGER` | Ban giám hiệu | Xem báo cáo, dashboard (read-only) |
| `TEACHER` | Giáo viên | Nhập điểm, xem lớp, hạnh kiểm (theo assignment) |
| `STUDENT` | Học sinh | Xem điểm, profile cá nhân |

### Vì sao cần Giáo vụ (ACADEMIC_STAFF)?

Giáo vụ là người vận hành hệ thống hàng ngày: phân lớp học sinh, phân công giáo viên, khóa bảng điểm, duyệt sửa điểm, chốt kết quả học kỳ. Không có giáo vụ, hệ thống chỉ là kho dữ liệu — không có người kích hoạt các workflow quan trọng.

### Admin khác Giáo vụ ở đâu?

| Tiêu chí | ADMIN | ACADEMIC_STAFF |
|---|---|---|
| Quản lý user/role | Có | Không |
| Tham số hệ thống | Có | Có |
| Nghiệp vụ học vụ | Không | Có (học sinh, lớp, điểm, báo cáo) |
| Audit log | Có | Có |

Admin là "quản trị hệ thống"; Giáo vụ là "nghiệp vụ học vụ". Hai role này không thay thế nhau được.

### Vì sao GVCN/GVBM không phải role riêng?

Trong thực tế một giáo viên có thể đồng thời là GVCN của lớp này và GVBM môn kia. Nếu tạo role riêng thì:
- Một user phải có nhiều role (hệ thống không hỗ trợ multi-role)
- Khi thay đổi phân công thì phải thay đổi role — rất khó quản lý

Giải pháp: cùng là role `TEACHER`, phân biệt qua bảng `TeacherAssignment`:
- `assignmentType = HOMEROOM` → GVCN lớp đó, học kỳ đó
- `assignmentType = SUBJECT` → GVBM môn đó, lớp đó, học kỳ đó

`PermissionScopeService` kiểm tra assignment khi request đến, không chỉ check role.

---

## 2. Bản đồ kiến trúc

### Stack công nghệ

```text
React 19 + Vite + TypeScript + TanStack Query + Zustand + Tailwind CSS
        ↕ REST API (Axios, base: http://localhost:3000/api/v1)
NestJS + TypeScript + Passport JWT + Prisma ORM
        ↕
PostgreSQL 14+
```

### Frontend dùng gì?

- **React 19** — UI framework
- **Vite** — build tool, dev server
- **TypeScript** — type safety
- **TanStack Query (React Query)** — server state, caching, mutation
- **Zustand** — client state (auth token, user info)
- **Tailwind CSS** — styling
- **React Router v6** — routing + ProtectedRoute
- **Axios** — HTTP client, cấu hình trong `frontend/src/lib/academic-api.ts`

### Backend dùng gì?

- **NestJS** — framework module-based
- **Prisma ORM** — truy cập DB, migrations, seed
- **Passport + JWT** — xác thực, `JwtAuthGuard`
- **class-validator / class-transformer** — DTO validation
- **pdfmake** — xuất PDF bảng điểm và phiếu điểm
- **xlsx** — đọc file Excel khi import
- **bcrypt** — hash mật khẩu
- **Swagger (OpenAPI)** — tài liệu API tại `http://localhost:3000/api`

### Luồng tổng quát

```text
User thao tác UI
→ Frontend (TanStack Query / Axios)
→ HTTP Request đến Controller
→ JwtAuthGuard kiểm tra Bearer token → giải mã JWT payload
→ RolesGuard kiểm tra role trong payload
→ DTO validate body/params
→ Service xử lý business rules
    → PermissionScopeService kiểm tra scope (GVCN/GVBM nếu cần)
    → PrismaService truy vấn / transaction
→ Service trả kết quả
→ Controller trả JSON response
→ Frontend cập nhật UI qua TanStack Query
```

---

## 3. Bản đồ database

### Nhóm 1 — Auth/RBAC

| Model | Lưu gì | Liên kết | Dùng trong flow |
|---|---|---|---|
| `User` | Tài khoản đăng nhập: username, passwordHash, status, roleId, studentId?, teacherId? | Role, Student, Teacher | Mọi flow (auth) |
| `Role` | Tên role: ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER, STUDENT | User, RolePermission | Đăng nhập, RolesGuard |
| `Permission` | Tên hành động (dự phòng, model tồn tại nhưng chưa dùng đầy đủ) | RolePermission | Chưa áp dụng vào guard |
| `RolePermission` | Bảng nối Role ↔ Permission | Role, Permission | Dự phòng |

**Lưu ý quan trọng:** `User` có `studentId` (nullable, unique) và `teacherId` (nullable, unique) — một user gắn với đúng một profile hoặc không gắn.

### Nhóm 2 — Student/Teacher/Academic

| Model | Lưu gì | Liên kết quan trọng | Dùng trong flow |
|---|---|---|---|
| `Student` | Hồ sơ học sinh: studentCode, fullName, gender, dateOfBirth, status | User?, Enrollment, Scores | Quản lý HS, nhập điểm, xem điểm |
| `Teacher` | Hồ sơ giáo viên: teacherCode, fullName, subjectId (môn chính), status | User?, TeacherAssignment, Class (GVCN) | Phân công GV, nhập điểm |
| `SchoolYear` | Năm học: name="2025-2026", startYear, endYear, isActive | Semester, Class, SystemParameter | Mọi entity học vụ |
| `Semester` | Học kỳ: HK1/HK2, startDate, endDate, isActive | SchoolYear, ScoreSheet, Enrollment | Mọi entity theo HK |
| `GradeLevel` | Khối lớp: level @unique (10, 11, 12) | Class | Tạo lớp |
| `Class` | Lớp học: classCode, name, maxSize, currentSize, gradeLevelId, homeroomTeacherId? | SchoolYear, Teacher, Enrollment, ScoreSheet | Phân lớp, điểm |
| `Subject` | Môn học: subjectCode, name, coefficient | Teacher, TeacherAssignment, ScoreSheet | Nhập điểm |
| `StudentClassEnrollment` | Phân lớp: studentId, classId, semesterId, status, semesterAverage? | Student, Class, Semester | Phân lớp, chuyển lớp |
| `TeacherAssignment` | Phân công: teacherId, classId, subjectId?, schoolYearId, semesterId?, assignmentType (HOMEROOM/SUBJECT) | Teacher, Class, Subject | GVCN/GVBM scope check |

### Nhóm 3 — Scores

| Model | Lưu gì | Liên kết | Dùng trong flow |
|---|---|---|---|
| `TestType` | Loại bài kiểm: ORAL_15M(w=1), ONE_PERIOD(w=2), MIDTERM(w=3), FINAL(w=3) | ScoreWeight, ScoreDetail | Nhập điểm |
| `ScoreWeight` | Hệ số theo năm học (override defaultWeight nếu cần) | SchoolYear, TestType | Tính điểm TB |
| `ScoreSheet` | Bảng điểm môn: classId + subjectId + semesterId (unique), status (DRAFT/SUBMITTED/LOCKED/NEEDS_CORRECTION) | Class, Subject, Semester, StudentSubjectScore | Nhập/khóa/sửa điểm |
| `StudentSubjectScore` | Điểm tổng hợp 1 học sinh 1 môn: averageScore, passStatus | ScoreSheet, Student, ScoreDetail | Điểm TB môn |
| `ScoreDetail` | Điểm chi tiết 1 lần kiểm: testTypeId, attemptNo, score, weightSnapshot | StudentSubjectScore, TestType | Nhập điểm |
| `ScoreChangeRequest` | Yêu cầu sửa điểm: oldScore, newScore, reason, status (PENDING/APPROVED/REJECTED) | ScoreSheet, StudentSubjectScore, ScoreDetail | Sửa điểm sau LOCK |

**Công thức điểm TB môn:**
```
ĐTBmôn = (Σ miệng*1 + Σ 15p*1 + Σ 1tiết*2 + GK*3 + CK*3) / (tổng hệ số)
```

### Nhóm 4 — Reports

| Model | Lưu gì | Dùng trong flow |
|---|---|---|
| `SubjectReport` + `SubjectReportDetail` | Tổng kết môn theo lớp: studentCount, passCount, passRate | Báo cáo môn |
| `SemesterReport` + `SemesterReportDetail` | Tổng kết học kỳ theo lớp | Báo cáo HK |

### Nhóm 5 — SystemParameter

| Model | Lưu gì | Liên kết | Dùng trong flow |
|---|---|---|---|
| `SystemParameter` | Tham số theo năm học (schoolYearId @unique): minAge, maxAge, maxClassSize, minScore, maxScore, subjectPassScore, semesterPassScore | SchoolYear | Validate tuổi, sĩ số, điểm |

### Nhóm 6 — Semester/Year-end Results

| Model | Lưu gì | Dùng trong flow |
|---|---|---|
| `SemesterStudentResult` | Kết quả chốt HK: studentId+semesterId (unique), semesterAverage, academicRating (EXCELLENT/GOOD/AVERAGE/WEAK/POOR), failedSubjectCount | Chốt kết quả HK |
| `YearEndResult` | Kết quả năm học: hk1Average, hk2Average, yearAverage, academicRating, conductRating, decision (ADVANCE/REMEDIAL/CONDUCT_REVIEW/RETAIN) | Tổng kết năm |

### Nhóm 7 — Conduct

| Model | Lưu gì | Dùng trong flow |
|---|---|---|
| `ConductAssessment` | Đánh giá hạnh kiểm 1 học sinh/HK: status (DRAFT/SUBMITTED/FINALIZED), finalRating (EXCELLENT/GOOD/AVERAGE/WEAK) | GVCN đánh giá, GV duyệt |
| `ConductCriterion` | 4 tiêu chí: ATTENDANCE, DISCIPLINE, ACADEMIC, ACTIVITIES — mỗi cái có rating | ConductAssessment |

### Nhóm 8 — Timetable

| Model | Lưu gì | Constraint | Dùng trong flow |
|---|---|---|---|
| `TimetableSlot` | Tiết học: semesterId, classId, subjectId, teacherId, dayOfWeek (1=T2..6=T7), period (1–5), room? | unique_class_slot + unique_teacher_slot (tránh trùng lịch) | Xem TKB |

### Audit/Other

| Model | Lưu gì |
|---|---|
| `AuditLog` | Nhật ký: userId, action, entityType, entityId, oldValue, newValue, ipAddress |

---

## 4. Bản đồ backend module

### Module và endpoint chính

| Module | Controller | Endpoint chính | Guard | Business rule chính |
|---|---|---|---|---|
| `auth` | `POST /auth/login`, `GET /auth/me` | Public (login), JwtAuth (me) | bcrypt so sánh, user.status=ACTIVE, trả JWT 8h |
| `users` | `GET /users`, `POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password` | ADMIN only | Username/email unique |
| `students` | `GET /students`, `POST /students`, `PATCH /students/:id` | ACADEMIC_STAFF | Tuổi trong [minAge, maxAge] theo SystemParameter |
| `teachers` | `GET /teachers`, `POST /teachers`, `PATCH /teachers/:id` | ACADEMIC_STAFF, MANAGER | — |
| `academic-years` | `GET /academic-years`, `POST /academic-years` | ACADEMIC_STAFF, ADMIN | name unique, startYear < endYear |
| `semesters` | `GET /semesters`, `POST /semesters`, `PATCH /semesters/:id` | ACADEMIC_STAFF, ADMIN | Không trùng tên trong cùng schoolYear |
| `grade-levels` | `GET /grade-levels`, `POST /grade-levels` | ACADEMIC_STAFF, ADMIN | level @unique |
| `classes` | `GET /classes`, `POST /classes`, `GET /classes/:id/students` | ACADEMIC_STAFF, MANAGER | classCode unique, currentSize ≤ maxSize |
| `subjects` | `GET /subjects`, `POST /subjects` | ACADEMIC_STAFF, ADMIN | subjectCode unique |
| `enrollments` | `POST /enrollments/assign`, `POST /enrollments/transfer` | ACADEMIC_STAFF | Không trùng lớp trong HK; sĩ số không vượt maxSize |
| `teacher-assignments` | `POST /teacher-assignments`, `GET /teachers/:id/assignments`, `GET /me/teacher-assignments` | ACADEMIC_STAFF (POST), TEACHER (me) | assignmentType HOMEROOM/SUBJECT |
| `system-parameters` | `GET /system-parameters`, `PATCH /system-parameters/:id` | GET: tất cả; PATCH: ADMIN, ACADEMIC_STAFF (không có MANAGER) | schoolYearId @unique |
| `scores` | `GET /scores/sheets`, `POST /scores/sheets`, `GET /scores/sheets/:id`, `PUT /scores/sheets/:id/students/:studentId`, `POST /scores/sheets/:id/submit`, `POST /scores/sheets/:id/lock`, `POST /scores/sheets/:id/unlock`, `GET /scores/sheets/:id/pdf`, `GET /scores/my-scores` | GET: ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER; write ops: ACADEMIC_STAFF, TEACHER; my-scores: STUDENT | Chỉ GVBM của lớp+môn+HK được nhập; lock/unlock cần ACADEMIC_STAFF (business rule) |
| `score-change-requests` | `GET /score-change-requests`, `POST /score-change-requests`, `POST /score-change-requests/:id/approve`, `POST /score-change-requests/:id/reject` | GET: ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER; POST (tạo): chỉ TEACHER; approve/reject: ACADEMIC_STAFF, TEACHER | Chỉ tạo khi sheet LOCKED; chỉ ACADEMIC_STAFF duyệt (business rule) |
| `reports` | `GET /reports/subject-summary`, `GET /reports/class-semester`, `GET /reports/student-semester/:studentId`, `GET /reports/dashboard-summary`, `GET /reports/student-transcript/:studentId/pdf` | ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER (một số); dashboard-summary: không có TEACHER | — |
| `semester-results` | `POST /semesters/:id/finalize`, `GET /semesters/:id/results`, `POST /school-years/:id/year-end`, `GET /reports/year-end` | ACADEMIC_STAFF | Tất cả sheet trong HK phải LOCKED |
| `conduct-assessments` | `GET /conduct-assessments`, `GET /conduct-assessments/students/:studentId`, `GET /conduct-assessments/:id`, `POST /conduct-assessments`, `POST /conduct-assessments/batch`, `PATCH /conduct-assessments/:id`, `POST /conduct-assessments/:id/submit`, `POST /conduct-assessments/:id/finalize` | TEACHER (tạo/cập nhật/submit), ACADEMIC_STAFF (finalize) | GVCN lớp mới tạo |
| `timetable` | `GET /timetable`, `GET /timetable/my`, `POST /timetable`, `POST /timetable/bulk`, `DELETE /timetable/:id` | ACADEMIC_STAFF (quản lý), TEACHER/STUDENT (my) | Không trùng lịch lớp; không trùng lịch GV |
| `import` | `GET /templates/students`, `GET /templates/score-sheet`, `POST /students/import/preview`, `POST /students/import/commit`, `POST /scores/sheets/:id/import/preview`, `POST /scores/sheets/:id/import/commit` | ACADEMIC_STAFF | 2 bước: preview xem trước lỗi, commit mới lưu |
| `audit-logs` | `GET /audit-logs` | ADMIN, ACADEMIC_STAFF | Chỉ xem, không tạo thủ công |

### Common/Auth infrastructure

- `JwtAuthGuard` — kiểm tra Bearer token hợp lệ, gắn user vào request
- `RolesGuard` + `@Roles(...)` decorator — check role từ JWT payload
- `PermissionScopeService` — kiểm tra scope GVCN/GVBM theo TeacherAssignment
- `ApiResponse` helper — wrap tất cả response thành `{ data, message }`

---

## 5. Bản đồ frontend route/page

| Route | Page/Component | Vai trò được vào | Backend liên quan |
|---|---|---|---|
| `/login` | `Login.tsx` | Tất cả (chưa đăng nhập) | `POST /auth/login` |
| `/dashboard` | `DashboardPage` | Tất cả | `GET /reports/dashboard` |
| `/users` | `UsersPage` | ADMIN | `GET/POST/PATCH /users`, `POST /users/:id/reset-password` |
| `/roles` | `RolesPage` | ADMIN | `GET /roles` |
| `/audit-logs` | `AuditLogPage` | ADMIN, ACADEMIC_STAFF | `GET /audit-logs` |
| `/students` | `StudentsPage` | ACADEMIC_STAFF, MANAGER | `GET/POST/PATCH /students` |
| `/classes` | `ClassesPage` | ACADEMIC_STAFF, MANAGER | `GET/POST /classes` |
| `/classes/:id` | `ClassDetailPage` | ACADEMIC_STAFF, MANAGER | `GET /classes/:id/students` |
| `/enrollments` | `EnrollmentsPage (mode=assign)` | ACADEMIC_STAFF, MANAGER | `POST /enrollments` |
| `/transfer` | `EnrollmentsPage (mode=transfer)` | ACADEMIC_STAFF, MANAGER | `POST /enrollments/transfer` |
| `/teachers` | `TeachersPage` | ACADEMIC_STAFF, MANAGER | `GET/POST/PATCH /teachers` |
| `/teacher-assignments` | `TeacherAssignmentsPage` | ACADEMIC_STAFF, MANAGER | `GET/POST /teacher-assignments` |
| `/my-assignments` | `MyTeacherAssignmentsPage` | TEACHER | `GET /me/teacher-assignments` |
| `/parameters` | `ParametersPage` | ADMIN, ACADEMIC_STAFF, MANAGER | `GET /system-parameters` (xem); `PATCH /system-parameters/:id` (chỉ ADMIN, ACADEMIC_STAFF) |
| `/scores` | `ScoreSheetsPage (mode=lookup)` | ACADEMIC_STAFF, TEACHER | `GET /scores/sheets` |
| `/scores/sheets/:id` | `ScoreEntryPage` | ACADEMIC_STAFF, TEACHER | `GET /scores/sheets/:id`; `PUT /scores/sheets/:id/students/:studentId` |
| `/score-entry` | `ScoreSheetsPage (mode=entry)` | TEACHER | `GET /scores/sheets` (filter của mình) |
| `/score-change-requests` | `ScoreChangeRequestsPage` | ACADEMIC_STAFF, TEACHER | `GET/POST /score-change-requests` |
| `/reports` | `ReportsPage` | ACADEMIC_STAFF, MANAGER | `GET /reports/subject-summary`, `GET /reports/class-semester` |
| `/class-report` | `ClassReportPage` | TEACHER | `GET /reports/class-semester` (lớp của mình) |
| `/subject-report` | `SubjectReportPage` | TEACHER | `GET /reports/subject-summary` |
| `/semester-finalize` | `SemesterFinalizePage` | ACADEMIC_STAFF, MANAGER | `POST /semesters/:id/finalize` |
| `/year-end` | `YearEndPage` | ACADEMIC_STAFF, MANAGER | `POST /school-years/:id/year-end` |
| `/conduct-assessment` | `ConductAssessmentPage` | TEACHER | `POST /conduct-assessments` |
| `/conduct-review` | `ConductReviewPage` | ACADEMIC_STAFF | `POST /conduct-assessments/:id/finalize` |
| `/timetable` | `TimetablePage` | ACADEMIC_STAFF | `GET/POST /timetable` |
| `/my-timetable` | `MyTimetablePage` | TEACHER, STUDENT | `GET /timetable/my` |
| `/my-profile` | `MyProfilePage` | STUDENT | `GET /auth/me` |
| `/my-scores` | `MyScoresPage` | STUDENT | `GET /scores/my-scores` |

---

## 6. Năm flow quan trọng

### Flow 1 — Login

```text
User nhập username + password → POST /api/v1/auth/login
→ AuthController.login()
→ AuthService.validateUser()
    → prisma.user.findUnique({ where: { username } })
    → kiểm tra user.status === 'ACTIVE'
    → bcrypt.compare(password, user.passwordHash)
→ AuthService.login()
    → tạo JWT payload: { sub: user.id, username, role: role.name, teacherId?, studentId? }
    → sign với expiresIn: '8h'
→ Controller trả { accessToken, user: { id, username, role, fullName } }
→ Frontend: Zustand lưu token + user info
→ React Router redirect đến /dashboard
```

### Flow 2 — Giáo vụ phân công giáo viên

```text
Giáo vụ chọn teacher + class + subject + semester + assignmentType
→ POST /api/v1/teacher-assignments
  body: { teacherId, classId, subjectId?, schoolYearId, semesterId?, assignmentType: "SUBJECT" }
→ JwtAuthGuard → RolesGuard(['ACADEMIC_STAFF'])
→ TeacherAssignmentsController.create()
→ TeacherAssignmentsService.create()
    → kiểm tra teacher/class/subject tồn tại
    → kiểm tra không trùng assignment
    → prisma.teacherAssignment.create(...)
→ Trả TeacherAssignment vừa tạo
→ Frontend invalidate query, reload danh sách
```

### Flow 3 — Giáo viên nhập điểm

```text
Teacher đăng nhập, vào /score-entry → ScoreSheetsPage (mode=entry)
→ GET /scores/sheets?filter=mine → danh sách sheet của mình
→ Chọn sheet → /scores/sheets/:id → ScoreEntryPage
→ GET /scores/sheets/:id → load dữ liệu điểm hiện tại
→ Teacher nhập điểm từng học sinh (1 học sinh / lần)
→ PUT /scores/sheets/:id/students/:studentId
  body: { details: [{ testTypeCode: "ORAL_15M", attemptNo: 1, score: 8.0 }, ...] }
→ JwtAuthGuard + RolesGuard(['ACADEMIC_STAFF', 'TEACHER'])
→ ScoresController.updateStudentScore()
→ ScoresService.updateStudentScore()
    → PermissionScopeService.isSubjectTeacherOfClass(teacherId, classId, subjectId, semesterId)
    → kiểm tra sheet.status === DRAFT (không cho sửa khi SUBMITTED/LOCKED)
    → validate score trong [minScore, maxScore] từ SystemParameter
    → prisma.scoreDetail.upsert(...) × N học sinh
    → tính lại averageScore cho từng StudentSubjectScore
→ Trả danh sách StudentSubjectScore đã cập nhật
```

### Flow 4 — Giáo vụ khóa bảng điểm và duyệt sửa điểm

**Khóa bảng điểm:**
```text
Giáo vụ chọn sheet SUBMITTED → POST /scores/sheets/:id/lock
→ RolesGuard(['ACADEMIC_STAFF', 'TEACHER']) — lưu ý: guard có TEACHER nhưng business rule chỉ cho ACADEMIC_STAFF
→ ScoresService.lock()
    → kiểm tra sheet.status === SUBMITTED
    → prisma.scoreSheet.update({ status: LOCKED, lockedAt: now })
→ Trả sheet đã cập nhật
```

**Duyệt sửa điểm (PENDING → APPROVED):**
```text
Giáo vụ vào /score-change-requests → xem list PENDING
→ GET /score-change-requests
→ Chọn request → POST /score-change-requests/:id/approve
  body: { reviewNote? }
→ ScoreChangeRequestsService.approve()
    → kiểm tra request.status === PENDING
    → cập nhật ScoreDetail.score = request.newScore
    → tính lại averageScore của StudentSubjectScore
    → cập nhật request.status = APPROVED, reviewedById, reviewedAt
    → (tất cả trong transaction)
→ Trả request đã duyệt
```

### Flow 5 — Học sinh xem điểm cá nhân

```text
Student đăng nhập → /my-scores → MyScoresPage
→ GET /scores/my-scores
→ JwtAuthGuard → lấy studentId từ JWT payload
→ ScoresService.getMyScores(user)
→ Trả danh sách StudentSubjectScore của student đó (điểm từng môn)
→ Frontend hiển thị điểm từng môn, từng bài kiểm
→ Student có thể gọi GET /reports/student-transcript/:studentId/pdf để xuất phiếu điểm PDF
```

---

## 7. Câu hỏi vấn đáp quan trọng

### Nhóm A — Kiến trúc

**Q1. NestJS chia code theo kiểu gì?**
Module-based. Mỗi module (auth, students, scores...) gồm: controller, service, DTO, module file. Module được import vào AppModule.

**Q2. Prisma ORM làm gì trong hệ thống này?**
Thay thế SQL thuần: định nghĩa schema (schema.prisma), generate TypeScript client, chạy migration, cung cấp `PrismaService` cho mọi service query.

**Q3. Guard trong NestJS là gì? Có mấy loại guard trong hệ thống?**
Guard là middleware chạy trước controller, trả về true/false cho phép hoặc chặn request. Hệ thống có 2: `JwtAuthGuard` (kiểm tra token hợp lệ) và `RolesGuard` (kiểm tra role từ payload).

**Q4. DTO là gì? Tại sao cần?**
Data Transfer Object — class TypeScript dùng `class-validator` để validate dữ liệu đầu vào. Giúp backend từ chối request thiếu field hoặc sai kiểu trước khi vào service.

**Q5. PermissionScopeService làm gì mà Guard không làm?**
Guard chỉ check role (TEACHER/ACADEMIC_STAFF). PermissionScopeService check sâu hơn: "giáo viên này có phải GVBM của lớp+môn+HK này không?" — phải query DB để biết.

**Q6. Transaction dùng trong flow nào?**
- Phân lớp/chuyển lớp (cập nhật Enrollment + currentSize 2 lớp)
- Duyệt yêu cầu sửa điểm (sửa ScoreDetail + tính lại averageScore)
- Chốt kết quả HK (tính + lưu SemesterStudentResult)
- Tổng kết năm học (tính + lưu YearEndResult)

### Nhóm B — Database

**Q7. Tại sao cần bảng ScoreDetail riêng, không lưu điểm trực tiếp trong StudentSubjectScore?**
Vì một học sinh có nhiều loại điểm (miệng, 1 tiết, giữa kỳ, cuối kỳ) và mỗi loại có thể có nhiều lần (attemptNo). ScoreDetail lưu từng điểm riêng lẻ, StudentSubjectScore lưu averageScore đã tính.

**Q8. ScoreSheet unique constraint là gì?**
`@@unique([classId, subjectId, semesterId])` — mỗi lớp chỉ có 1 bảng điểm cho mỗi môn trong mỗi học kỳ.

**Q9. TeacherAssignment khác Class.homeroomTeacherId ở chỗ nào?**
`Class.homeroomTeacherId` là FK ngắn gọn cho display (hiển thị GVCN của lớp). `TeacherAssignment` là bảng chi tiết theo năm học/học kỳ, lưu assignmentType, isActive, createdBy — là nguồn sự thật cho scope check.

**Q10. SystemParameter có ràng buộc gì đặc biệt?**
`schoolYearId @unique` — mỗi năm học chỉ có 1 bộ tham số. Không thể tạo 2 bộ tham số cho cùng năm học.

**Q11. GradeLevel.level có ràng buộc gì?**
`level @unique` — không thể có 2 khối cùng số (VD: không thể có 2 khối 10).

**Q12. StudentClassEnrollment dùng để làm gì? Tại sao không lưu classId trực tiếp trong Student?**
Vì học sinh có thể đổi lớp trong năm (chuyển lớp), và lịch sử phân lớp cần được giữ lại. Enrollment có `status` (ACTIVE/ENDED) và `endedAt` để track.

### Nhóm C — Auth/RBAC

**Q13. JWT payload chứa những gì?**
`{ sub: userId, username, role: "TEACHER", teacherId?: number, studentId?: number }`

**Q14. Token hết hạn sau bao lâu?**
8 giờ (cấu hình `expiresIn: '8h'` trong AuthService).

**Q15. Frontend lưu token ở đâu?**
Zustand store (in-memory). Không lưu localStorage để tránh XSS. Mất token khi refresh trang — MVP trade-off.

**Q16. Nếu user bị disable (status=INACTIVE), login có được không?**
Không. AuthService kiểm tra `user.status === 'ACTIVE'` trước khi sign token.

**Q17. RolesGuard đọc role từ đâu?**
Từ JWT payload được JwtAuthGuard gắn vào `request.user`. Không query DB lại.

### Nhóm D — GVCN/GVBM

**Q18. Làm thế nào để biết teacher01 là GVCN lớp 10A1?**
Query `TeacherAssignment` where `teacherId = teacher01.id AND classId = 10A1.id AND assignmentType = HOMEROOM`.

**Q19. Một giáo viên có thể là GVCN nhiều lớp không?**
Theo schema không có constraint cấm. Nhưng thực tế business rule (trong AGENTS.md) là 1 giáo viên chỉ làm GVCN 1 lớp/năm. Service nên validate điều này.

**Q20. teacher05 là GVBM Hóa — teacher05 có thể nhập điểm Toán của lớp 10A1 không?**
Không. PermissionScopeService.isSubjectTeacherOfClass(teacher05.id, 10A1.id, Toan.id, semester.id) trả false — không có TeacherAssignment SUBJECT cho teacher05+Toán+10A1.

**Q21. ACADEMIC_STAFF có cần TeacherAssignment không?**
Không. ACADEMIC_STAFF được phép thao tác tất cả dữ liệu học vụ mà không cần assignment. Scope check chỉ áp dụng cho TEACHER.

### Nhóm E — Score workflow

**Q22. ScoreSheetStatus có bao nhiêu trạng thái?**
4: DRAFT → SUBMITTED → LOCKED, và NEEDS_CORRECTION (khi có yêu cầu sửa điểm đang chờ xử lý).

**Q23. Khi nào không cho nhập điểm?**
Khi sheet.status là SUBMITTED, LOCKED, hoặc NEEDS_CORRECTION — chỉ DRAFT mới được sửa.

**Q24. ScoreChangeRequest chỉ tạo được khi nào?**
Khi sheet.status === LOCKED. Nếu sheet còn DRAFT/SUBMITTED, teacher phải sửa trực tiếp.

**Q25. Ai được duyệt/từ chối ScoreChangeRequest?**
Theo AGENTS.md (business rule): chỉ ACADEMIC_STAFF. Tuy nhiên code controller có `@Roles('ACADEMIC_STAFF', 'TEACHER')` — đây là discrepancy đã ghi nhận trong docs/authorization.md.

**Q26. Công thức tính điểm TB môn là gì?**
```
ĐTBmôn = (Σ ORAL_15M×1 + Σ ONE_PERIOD×2 + MIDTERM×3 + FINAL×3) / tổng_hệ_số
```
Hệ số lấy từ ScoreWeight theo năm học, snapshot vào ScoreDetail.weightSnapshot khi nhập.

### Nhóm F — Reports

**Q27. SubjectReport và SemesterReport được tạo ra thế nào?**
Giáo vụ gọi `GET /reports/subject` hoặc `GET /reports/semester` — service tổng hợp từ StudentSubjectScore và StudentClassEnrollment, lưu vào SubjectReport/SemesterReport.

**Q28. Chốt kết quả HK làm gì?**
`POST /semesters/:id/finalize` — service tính semesterAverage, academicRating cho từng học sinh và lưu vào `SemesterStudentResult`. Điều kiện: tất cả ScoreSheet trong HK phải LOCKED.

**Q29. Tổng kết năm làm gì?**
`POST /school-years/:id/year-end` — tổng hợp kết quả HK1 + HK2, tính yearAverage, academicRating, conductRating, ra decision (ADVANCE/REMEDIAL/RETAIN/CONDUCT_REVIEW).

**Q30. PDF xuất bằng thư viện gì?**
`pdfmake`. Có 2 loại: bảng điểm lớp (`GET /scores/sheets/:id/pdf`) và phiếu điểm cá nhân (`GET /reports/student-transcript/:studentId/pdf`).

### Nhóm G — Frontend flow

**Q31. TanStack Query giúp gì so với gọi Axios thuần?**
Caching (không re-fetch nếu data còn mới), auto-refetch khi focus tab, loading/error state tự động, `invalidateQueries` để refresh sau mutation.

**Q32. ProtectedRoute hoạt động như thế nào?**
Wrap các Route với `allowedRoles` prop. Kiểm tra Zustand store có user không; nếu role không khớp → redirect /login hoặc /dashboard.

**Q33. academic-api.ts làm gì?**
File tập trung tất cả Axios calls + TypeScript interface. Mỗi module có nhóm function riêng. Frontend không gọi Axios trực tiếp ở component — phải qua file này.

**Q34. Zustand dùng để làm gì trong hệ thống?**
Lưu auth state: `{ user, token, setAuth, logout }`. Được dùng bởi ProtectedRoute và Axios interceptor để đính kèm Bearer token.

### Nhóm H — Seed/Demo

**Q35. Seed data năm học nào?**
2025-2026. HK1: 01/09/2025–15/01/2026 (isActive=false). HK2: 16/01/2026–30/05/2026 (isActive=true).

**Q36. Có bao nhiêu giáo viên trong seed? Ai dạy gì?**
5 giáo viên:
- teacher01 (T001): GVCN 10A1 + GVBM Toán/10A1, 10A2
- teacher02 (T002): GVCN 10A2 + GVBM Văn/10A1, 10A2
- teacher03 (T003): GVCN 11A1 + GVBM Anh/10A1, 11A1
- teacher04 (T004): GVCN 12A1 + GVBM Vật lý/10A1, 11A1, 12A1
- teacher05 (T005): GVBM Hóa/10A1 (không có lớp CN)

**Q37. Bảng điểm nào đang LOCKED, SUBMITTED, DRAFT trong seed?**
- LOCKED: Toán/Văn/Anh/10A1 HK1; Toán/Văn/10A2 HK1; Anh/11A1 HK1; VL/12A1 HK1
- SUBMITTED: VL/10A1 HK1; VL/11A1 HK1
- DRAFT: Hóa/10A1 HK1 (điểm 12/20 HS); Toán/Văn/10A1 HK2

**Q38. Tài khoản học sinh nào có trong seed?**
Student codes **không tuần tự** — mỗi lớp dùng prefix riêng:
- 10A1 (20 hs): S001–S005 (có tài khoản login) + S101–S115 (không có tài khoản)
- 10A2 (15 hs): S007 (có tài khoản) + S201–S214 (không có tài khoản)
- 11A1 (15 hs): S301–S315 (không có tài khoản)
- 11A2 (12 hs): S401–S412 (không có tài khoản)
- 12A1 (8 hs): S501–S508 (không có tài khoản)
- Pending (3 hs): S006 (có tài khoản `student06`), S601, S602

Tổng tài khoản học sinh: `student01`–`student05` (10A1), `student06` (pending), `student07` (10A2) — **7 tài khoản**.

### Nhóm I — Error handling & Transaction

**Q39. Khi nhập điểm ngoài khoảng hợp lệ, hệ thống xử lý thế nào?**
Service đọc SystemParameter để lấy [minScore, maxScore]. Nếu score ngoài khoảng, throw `BadRequestException` với message mô tả lỗi. Controller không cần biết — exception filter của NestJS format thành `{ statusCode, message, error }`.

**Q40. Tại sao cần transaction khi chuyển lớp?**
Chuyển lớp phải: (1) set enrollment cũ status=ENDED, (2) tạo enrollment mới, (3) giảm currentSize lớp cũ, (4) tăng currentSize lớp mới. Nếu bước 3 hoặc 4 fail mà không rollback, currentSize bị sai vĩnh viễn.

---

## 8. Câu hỏi modify database/API

### Tình huống 1 — Thêm điểm danh

**Có cần sửa database không?**
Có. Cần thêm bảng mới vì chưa có trong schema.

**Thêm bảng hay cột?**
Thêm 2 bảng:
```prisma
model AttendanceRecord {
  id         Int      @id
  studentId  Int
  classId    Int
  semesterId Int
  date       DateTime
  status     String   // PRESENT|ABSENT|LATE|EXCUSED
  note       String?
}
```

**Model/API/Service/Page bị ảnh hưởng:**
- Mới: `attendance` module (controller, service, DTO)
- Ảnh hưởng: `students` (xem lịch sử điểm danh), `classes` (xem danh sách điểm danh hôm nay)
- Cân nhắc: link với `YearEndResult` hoặc `ConductAssessment` nếu tỉ lệ nghỉ học ảnh hưởng hạnh kiểm

**Business rule cần kiểm tra:**
- Chỉ GVCN hoặc ACADEMIC_STAFF được điểm danh lớp của mình
- Không điểm danh ngược về quá khứ quá N ngày
- Một học sinh + một lớp + một ngày chỉ có 1 bản ghi (unique constraint)

**Test case cần có:**
- TC: GVCN điểm danh lớp của mình → 201
- TC: GVCN điểm danh lớp khác → 403
- TC: điểm danh trùng ngày → 409
- TC: xem lịch sử điểm danh học sinh

---

### Tình huống 2 — Thêm phụ huynh

**Có cần sửa database không?**
Có. Thêm bảng mới.

**Thêm bảng hay cột?**
```prisma
model Parent {
  id        Int     @id
  fullName  String
  phone     String
  email     String?
  studentId Int     @map("student_id")
  relation  String  // FATHER|MOTHER|GUARDIAN
  student   Student @relation(fields: [studentId], references: [id])
}
```
Thêm `parents Parent[]` vào `Student`.

**Model/API/Service/Page bị ảnh hưởng:**
- Mới: `parents` module
- Ảnh hưởng: `students` (include parents khi GET), `users` (có thể thêm role PARENT)

**Business rule:**
- Một học sinh có thể có nhiều phụ huynh (bố + mẹ + người giám hộ)
- Nếu thêm role PARENT: user phải link với student qua Parent record

**Test case:**
- Thêm phụ huynh cho học sinh → 201
- Học sinh không tồn tại → 404
- Xem danh sách phụ huynh của học sinh

---

### Tình huống 3 — Thêm thông báo (notification)

**Có cần sửa database không?**
Có.

**Thêm bảng:**
```prisma
model Notification {
  id         Int      @id
  title      String
  content    String   @db.Text
  targetRole String?  // null = tất cả
  createdBy  Int
  createdAt  DateTime @default(now())
  isActive   Boolean  @default(true)
}
model NotificationRead {
  id             Int      @id
  notificationId Int
  userId         Int
  readAt         DateTime @default(now())
  @@unique([notificationId, userId])
}
```

**Bị ảnh hưởng:** mới `notifications` module; frontend: badge số thông báo chưa đọc trong Header

**Business rule:**
- ADMIN/ACADEMIC_STAFF tạo thông báo
- `targetRole = null` gửi tất cả; `targetRole = TEACHER` chỉ gửi GV
- Đánh dấu đã đọc khi user click

---

### Tình huống 4 — Thêm học bạ PDF (nhiều năm)

**Có cần sửa database không?**
Không. Dữ liệu đã có: `YearEndResult` có đủ hk1Average, hk2Average, yearAverage, academicRating, conductRating, decision.

**Cần làm gì:**
- Thêm endpoint `GET /reports/transcript-book/:studentId/pdf`
- Service tổng hợp nhiều `YearEndResult` theo schoolYearId, sắp xếp theo năm
- Dùng pdfmake (đã có trong backend) để render học bạ nhiều trang

**Bị ảnh hưởng:**
- `reports.controller.ts` — thêm endpoint mới
- `reports.service.ts` — thêm hàm `generateTranscriptBookPdf`
- Frontend: thêm button "Xuất học bạ" trong trang profile học sinh

**Business rule:**
- STUDENT xem học bạ của chính mình; ACADEMIC_STAFF xem của bất kỳ ai

---

### Tình huống 5 — Thêm audit log chi tiết hơn

**Hiện tại:** `AuditLog` có action, entityType, entityId, oldValue, newValue (dạng JSON text).

**Cần sửa gì:**
Không cần thêm bảng. Có thể thêm cột:
```prisma
model AuditLog {
  ...
  metadata   String? @db.Text // JSON: { ip, userAgent, duration, ... }
  severity   String  @default("INFO") // INFO|WARN|ERROR
}
```

**Bị ảnh hưởng:**
- `audit-logs.service.ts` — sửa hàm `log()` để ghi thêm metadata
- Mọi service gọi `auditLog.log(...)` đều cần truyền thêm context
- Frontend `AuditLogPage`: thêm filter theo severity

---

### Tình huống 6 — Thêm soft delete cho học sinh

**Có cần sửa database không?**
Có. Thêm cột:
```prisma
model Student {
  ...
  deletedAt DateTime? @map("deleted_at")
  deletedBy Int?      @map("deleted_by")
}
```

**Bị ảnh hưởng:**
- `StudentsService.findAll()` phải thêm `where: { deletedAt: null }`
- `StudentsService.remove()` không dùng `delete` mà dùng `update({ deletedAt: now() })`
- Thêm endpoint `POST /students/:id/restore` để khôi phục
- Mọi query có relation đến Student phải check `deletedAt`

**Business rule:**
- Không được xóa học sinh đang có enrollment ACTIVE
- Chỉ ADMIN hoặc ACADEMIC_STAFF được xóa/khôi phục
- AuditLog khi soft delete

---

### Tình huống 7 — Nhiều giáo viên cùng dạy một mcôn

**Vấn đề hiện tại:**
`ScoreSheet` có `@@unique([classId, subjectId, semesterId])` — chỉ 1 bảng điểm cho 1 lớp + 1 môn + 1 HK. Không hỗ trợ 2 GV chia nhóm.

**Cần sửa database:**
Xóa/sửa unique constraint; thêm cột `teacherId` vào `ScoreSheet`:
```prisma
model ScoreSheet {
  ...
  teacherId Int? @map("teacher_id")
  // Đổi unique thành: @@unique([classId, subjectId, semesterId, teacherId])
}
```

**Bị ảnh hưởng:**
- `scores.service.ts` — logic create/find sheet phải tính đến teacherId
- `TeacherAssignment` — có thể nhiều assignment SUBJECT cho cùng classId+subjectId
- `PermissionScopeService.isSubjectTeacherOfClass` — return list teachers thay vì boolean
- Frontend `ScoreSheetsPage` — hiển thị nhiều sheet cho 1 môn

**Business rule:**
- Tổng học sinh của các sheet con phải bằng tổng học sinh lớp
- Mỗi học sinh chỉ có 1 ScoreSheet cho 1 môn (ràng buộc ở StudentSubjectScore)

---

### Tình huống 8 — Thêm duyệt chuyển lớp (approval workflow)

**Hiện tại:** chuyển lớp trực tiếp không cần duyệt.

**Cần thêm bảng:**
```prisma
model TransferRequest {
  id           Int      @id
  studentId    Int
  fromClassId  Int
  toClassId    Int
  semesterId   Int
  reason       String   @db.Text
  status       String   @default("PENDING") // PENDING|APPROVED|REJECTED
  requestedBy  Int
  reviewedBy   Int?
  reviewedAt   DateTime?
  reviewNote   String?
}
```

**Bị ảnh hưởng:**
- Mới: `transfer-requests` module
- Sửa: `enrollments.service.ts` — transfer chỉ thực hiện khi TransferRequest được APPROVED
- Frontend: trang mới "Duyệt chuyển lớp" cho ACADEMIC_STAFF

**Test case:**
- ACADEMIC_STAFF tạo request → trạng thái PENDING
- ACADEMIC_STAFF duyệt → chuyển lớp thực sự xảy ra
- ACADEMIC_STAFF từ chối → học sinh giữ lớp cũ

---

### Tình huống 9 — Import điểm Excel

**Đã implement rồi.** Endpoint hiện có:
- `GET /templates/score-sheet` — tải template Excel
- `POST /scores/sheets/:id/import/preview` — preview lỗi trước khi lưu
- `POST /scores/sheets/:id/import/commit` — lưu thật

**Nếu hỏi "thêm như thế nào":**
Pattern 2 bước (preview → commit) giúp user thấy lỗi trước khi commit. Service đọc Excel bằng `xlsx`, validate từng dòng, trả về `{ valid: [], errors: [] }`. Khi commit, chỉ lưu các dòng valid.

---

### Tình huống 10 — Thêm export báo cáo ra Excel

**Chưa implement** (hiện chỉ có PDF).

**Cần làm gì:**
- Thêm endpoint `GET /reports/subject/export`, `GET /reports/semester/export`
- Dùng thư viện `xlsx` (đã có trong package.json cho import) để write
- Trả file với `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Không cần sửa database.** Chỉ thêm endpoint + service method.

---

### Tình huống 11 — Thêm phân quyền chi tiết theo Permission

**Hiện tại:** Model `Permission` và `RolePermission` đã có trong schema nhưng chưa dùng trong guard.

**Cần làm gì:**
- Seed `Permission` records: `{ action: 'students:create' }`, `{ action: 'scores:lock' }`, ...
- Seed `RolePermission`: ACADEMIC_STAFF có `students:create`, `scores:lock`, ...
- Tạo `PermissionsGuard` mới: query DB lấy permissions của user, check action cần thiết
- Thêm `@RequirePermission('scores:lock')` decorator thay cho `@Roles(...)`

**Model bị ảnh hưởng:** Permission, RolePermission (đã có, chỉ cần seed và dùng)
**Service bị ảnh hưởng:** Tất cả controller cần đổi guard

---

### Tình huống 12 — Thêm lịch học / thời khóa biểu chi tiết

**Đã implement.** TimetableSlot có: semesterId, classId, subjectId, teacherId, dayOfWeek, period, room.

**Nếu muốn mở rộng thêm:**
- Thêm `startTime`, `endTime` thay cho period số
- Thêm `recurrence` (hàng tuần vs đặc biệt)
- Thêm conflict detection khi bulk create (`POST /timetable/bulk`)

---

### Tình huống 13 — Thêm hạnh kiểm

**Đã implement.** `ConductAssessment` + `ConductCriterion` (4 tiêu chí: ATTENDANCE, DISCIPLINE, ACADEMIC, ACTIVITIES).

**Nếu hỏi "thêm tiêu chí mới":**
- `ConductCriterion.code` là String (không phải enum) → không cần migration
- Chỉ cần seed thêm criterion code mới
- Frontend dropdown cần cập nhật danh sách

---

### Tình huống 14 — Thêm tổng kết năm học

**Đã implement.** `YearEndResult` có: hk1Average, hk2Average, yearAverage, academicRating, conductRating, decision (ADVANCE/REMEDIAL/CONDUCT_REVIEW/RETAIN).

**Nếu hỏi "thêm quy tắc lên lớp khác":**
- Sửa `semester-results.service.ts` — hàm tính decision
- Không cần sửa schema nếu chỉ thay đổi logic tính toán

---

### Tình huống 15 — Thêm trạng thái nghỉ học/chuyển trường

**Hiện tại:** `Student.status` và `StudentClassEnrollment.status` đã có.

**Cần thêm:**
```prisma
model Student {
  ...
  // status: ACTIVE | SUSPENDED | TRANSFERRED | GRADUATED | WITHDRAWN
  withdrawalDate  DateTime? @map("withdrawal_date")
  withdrawalReason String?  @map("withdrawal_reason")
}
```

**Logic:**
- Khi status = TRANSFERRED/WITHDRAWN: set tất cả enrollment ACTIVE thành ENDED
- Không cho phân lớp mới khi status ≠ ACTIVE
- Audit log ghi lại thay đổi trạng thái

**Test case:**
- Nghỉ học → enrollment bị ENDED tự động
- Cố phân lớp học sinh đã nghỉ → 400

---

## 9. Checklist demo

### Tài khoản demo (từ seed)

| Role | Username | Password | Profile |
|---|---|---|---|
| ADMIN | `admin` | `Admin@123` | Quản trị viên |
| ACADEMIC_STAFF | `giaovu01` | `Staff@123` | Giáo vụ trưởng |
| MANAGER | `manager01` | `Manager@123` | Hiệu phó |
| TEACHER (GVCN 10A1) | `teacher01` | `Teacher@123` | Dạy Toán |
| TEACHER (GVCN 10A2) | `teacher02` | `Teacher@123` | Dạy Văn |
| TEACHER (GVCN 11A1) | `teacher03` | `Teacher@123` | Dạy Anh |
| TEACHER (GVCN 12A1) | `teacher04` | `Teacher@123` | Dạy Vật lý |
| TEACHER (GVBM) | `teacher05` | `Teacher@123` | Dạy Hóa |
| STUDENT | `student01` | `Student@123` | Học sinh 10A1 |

### Flow demo nên trình bày (9 bước)

1. **Login admin** → vào Users, xem danh sách tài khoản, xem Audit Log
2. **Login giaovu01** → xem Dashboard (tổng quan trường)
3. **giaovu01** → Học sinh: thêm học sinh mới / xem danh sách
4. **giaovu01** → Phân lớp: phân học sinh vào lớp 10A1, HK2
5. **giaovu01** → Phân công GV: tạo TeacherAssignment SUBJECT cho teacher01/Toán/10A1/HK2
6. **Login teacher01** → Nhập điểm: vào score-entry → chọn Toán/10A1/HK2 (DRAFT) → nhập điểm → submit
7. **Login giaovu01** → Khóa bảng điểm Vật lý/10A1/HK1 (đang SUBMITTED)
8. **giaovu01** → Score Change Requests: duyệt yêu cầu sửa điểm PENDING của S003
9. **Login student01** → xem điểm cá nhân tại /my-scores
10. **Login manager01** → xem báo cáo, chốt kết quả HK

### Các lỗi thường gặp khi demo

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| 401 Unauthorized | Token hết hạn (8h) hoặc không có token | Đăng nhập lại |
| 403 Forbidden | Role không đủ quyền | Đăng nhập đúng role |
| 400 Bad Request khi nhập điểm | Điểm ngoài [0, 10] hoặc sai format | Kiểm tra lại giá trị |
| Không thấy sheet để nhập | Chưa có TeacherAssignment cho teacher này | Giáo vụ tạo assignment trước |
| Cannot read properties of undefined | Frontend query chưa load xong | Chờ loading, kiểm tra network |
| Prisma unique constraint | Trùng enrollment / sheet | Kiểm tra seed, không seed lại nhiều lần |

### Cách giải thích nếu giảng viên hỏi sâu

**"Tại sao không dùng localStorage lưu token?"**
→ Để tránh XSS. Token trong localStorage có thể bị đọc bởi JavaScript độc hại. Zustand (in-memory) an toàn hơn cho MVP. Nếu muốn persist qua refresh, dùng httpOnly cookie.

**"GVCN/GVBM scope check ở service hay guard?"**
→ Ở service, qua PermissionScopeService. Guard chỉ check role tổng. Scope check cần query DB (TeacherAssignment) nên phải ở service layer.

**"Tại sao ScoreChangeRequest cần oldScore và newScore?"**
→ Để audit trail. Khi duyệt, service cần biết score hiện tại (oldScore) để validate, và score mới (newScore) để apply. Đồng thời lưu lịch sử thay đổi.

**"Import Excel 2 bước để làm gì?"**
→ Preview cho user thấy lỗi (dòng nào sai format, học sinh không tồn tại) trước khi commit. Tránh import một phần: commit toàn bộ hoặc không gì cả. UX tốt hơn "import rồi mới thấy lỗi".

**"Tại sao có cả SubjectReport lẫn SemesterReport?"**
→ SubjectReport: thống kê theo từng môn (bao nhiêu % đạt môn Toán). SemesterReport: thống kê tổng hợp học kỳ (bao nhiêu % học sinh qua học kỳ). Hai góc nhìn khác nhau, dùng trong các context khác nhau.

**"Nếu giảng viên hỏi về một tính năng chưa demo được"**
→ Nêu tên endpoint, giải thích flow, chỉ vào code (controller/service tương ứng). Không nên nói "chưa làm" nếu thực ra đã implement — hãy mở Swagger lên demo trực tiếp qua API.
