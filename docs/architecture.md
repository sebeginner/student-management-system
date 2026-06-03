# Architecture — Kiến trúc hệ thống Quản lý học sinh SE104

## 1. Mục tiêu kiến trúc

Hệ thống cần dễ demo, dễ chia việc cho nhóm và đủ khả năng phát triển sau MVP.

Kiến trúc:

```text
React Frontend → REST API NestJS → Prisma ORM → PostgreSQL
```

## 2. Tổng quan thành phần

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | Giao diện người dùng |
| Backend | NestJS + TypeScript | API, business logic, auth |
| ORM | Prisma | Truy cập database, migrations |
| Database | PostgreSQL 14+ | Lưu dữ liệu hệ thống |
| Auth | JWT + bcrypt (Passport) | Đăng nhập, bảo vệ API |
| API Docs | Swagger/OpenAPI | `http://localhost:3000/api` |

## 3. Luồng request

```text
User thao tác UI
→ Frontend (TanStack Query / Axios)
→ Controller nhận request
→ JwtAuthGuard + RolesGuard kiểm tra auth/role
→ DTO validate dữ liệu đầu vào
→ Service xử lý business rules + scope check (TeacherAssignment)
→ PrismaService truy vấn / transaction
→ Service trả kết quả
→ Controller trả response JSON
→ Frontend cập nhật UI
```

## 4. Backend modules thực tế

```text
backend/src/
  auth/                  — Login, JWT strategy, Guards
  users/                 — CRUD tài khoản (ADMIN only)
  students/              — Hồ sơ học sinh, CRUD
  teachers/              — Hồ sơ giáo viên, CRUD
  academic-years/        — Năm học
  semesters/             — Học kỳ
  grade-levels/          — Khối lớp (10, 11, 12)
  classes/               — Lớp học
  subjects/              — Môn học
  enrollments/           — Phân lớp, chuyển lớp
  teacher-assignments/   — Phân công GVCN/GVBM
  system-parameters/     — Tham số hệ thống (tuổi, sĩ số, điểm)
  scores/                — Bảng điểm, nhập điểm, submit, lock, PDF
  score-change-requests/ — Yêu cầu sửa điểm sau khi LOCKED
  reports/               — Báo cáo môn, HK, dashboard, PDF phiếu điểm
  semester-results/      — Chốt kết quả HK + tổng kết năm học
  conduct-assessments/   — Hạnh kiểm học sinh
  timetable/             — Thời khóa biểu
  import/                — Import Excel học sinh + điểm
  audit-logs/            — Nhật ký thao tác hệ thống
  common/                — Guards, decorators, filters, api-response helper
  authorization/         — PermissionScopeService (kiểm tra scope GVCN/GVBM)
  prisma/                — PrismaService (singleton)
```

## 5. Trách nhiệm từng layer backend

| Layer | Trách nhiệm | Không nên làm |
|---|---|---|
| Controller | Nhận request, gọi service, trả response | Không viết business logic, không query DB trực tiếp |
| DTO | Validate format, field bắt buộc, type | Không query database, không business logic |
| Service | Business rules, transaction, scope check | Không xử lý HTTP |
| PrismaService | Kết nối database | Không chứa business logic |
| Guard | Kiểm tra auth/role | Không xử lý dữ liệu nghiệp vụ |
| PermissionScopeService | Kiểm tra scope GVCN/GVBM | Là service nội bộ, không phải guard |

## 6. Frontend structure thực tế

```text
frontend/src/
  components/        — UI components dùng chung
  pages/             — Page components theo feature
  lib/
    academic-api.ts  — Toàn bộ Axios calls + TypeScript types
    auth-store.ts    — Zustand: token, user info
  router/            — React Router config + ProtectedRoute
  types/             — Shared types
```

## 7. Quy ước API

Base URL: `http://localhost:3000/api/v1`

Mọi request (trừ login) cần header:

```http
Authorization: Bearer <access_token>
```

Response thành công:

```json
{ "data": {}, "message": "Success" }
```

Response lỗi:

```json
{ "statusCode": 400, "message": "Mô tả lỗi", "error": "Bad Request" }
```

## 8. Auth architecture

```text
POST /auth/login
→ kiểm tra User.status = ACTIVE
→ bcrypt.compare(password, passwordHash)
→ tạo JWT payload { sub, username, role, teacherId, studentId }
→ trả accessToken (8 giờ) + thông tin user
```

Frontend lưu token trong Zustand store (in-memory) cho MVP.

## 9. Role-based access

| Role | Quyền |
|---|---|
| `ADMIN` | Quản lý tài khoản, role, tham số, audit log |
| `ACADEMIC_STAFF` | Toàn quyền nghiệp vụ học vụ: học sinh, lớp, điểm, báo cáo, import |
| `MANAGER` | Xem báo cáo toàn trường (read-only) |
| `TEACHER` | Quyền theo `TeacherAssignment` — GVCN xem lớp CN, GVBM nhập/sửa điểm |
| `STUDENT` | Chỉ xem dữ liệu cá nhân |

> **Nguyên tắc quan trọng:** GVCN và GVBM không phải role riêng. Đều là `TEACHER`, phân biệt qua `TeacherAssignment.assignmentType = HOMEROOM | SUBJECT`. Backend phải kiểm tra scope theo assignment, không chỉ check role.

## 10. Nguyên tắc transaction

Dùng Prisma transaction cho:

- Phân lớp/chuyển lớp (cập nhật enrollment + currentSize hai lớp).
- Duyệt yêu cầu sửa điểm (cập nhật điểm + tính lại averageScore).
- Chốt kết quả học kỳ (tính + lưu SemesterStudentResult).
- Tổng kết năm học (tính + lưu YearEndResult).

## 11. Xử lý lỗi thống nhất

Backend trả lỗi qua NestJS exception filters:

```json
{ "statusCode": 400, "message": "Tuổi học sinh không nằm trong khoảng cho phép", "error": "Bad Request" }
```

Business error keys (dùng trong service):
- `STUDENT_NOT_FOUND`, `CLASS_FULL`, `NOT_SUBJECT_TEACHER`, `SCORE_SHEET_LOCKED`, ...

Frontend không hiển thị lỗi kỹ thuật thô — bắt `errorKey` hoặc `message` để hiển thị thân thiện.

## 12. Phân quyền scope GVCN/GVBM (quan trọng)

`PermissionScopeService` cung cấp các hàm kiểm tra:

```ts
isHomeroomTeacherOfClass(teacherId, classId, schoolYearId) → boolean
isSubjectTeacherOfClass(teacherId, classId, subjectId, semesterId) → boolean
canEditSubjectScore(user, classId, subjectId, semesterId, status)
canLockScoreSheet(user)           // → chỉ ACADEMIC_STAFF
canApproveScoreChangeRequest(user) // → chỉ ACADEMIC_STAFF
```

`StudentsService`, `ClassesService`, `ScoresService` đều dùng service này để tránh lặp logic.
