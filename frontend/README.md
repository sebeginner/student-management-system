# Student Management System — Frontend SE104

React + TypeScript + Vite frontend cho hệ thống quản lý học sinh cấp 3.

## Stack

| Thư viện | Mục đích |
|---|---|
| React 19 + Vite | Bundler, HMR |
| TypeScript | Type safety |
| React Router 7 | Client-side routing |
| TanStack Query | Server state, caching, refetch |
| Zustand | Auth state (token, user) |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI components |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client |

## Cài đặt và chạy

```bash
npm install
cp .env.example .env
```

`.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Khởi động:

```bash
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

## Cấu trúc thư mục chính

```
frontend/src/
  components/      — UI components dùng chung (table, modal, badge, ...)
  pages/           — Page components theo feature
  lib/
    academic-api.ts — API layer duy nhất (tất cả Axios calls + types)
    auth-store.ts   — Zustand store cho auth state
  router/          — React Router config + ProtectedRoute
  types/           — Shared TypeScript types
```

## Routes và phân quyền

| Route | Page | Role được phép |
|---|---|---|
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | Tất cả |
| `/users`, `/roles` | UsersPage, RolesPage | ADMIN |
| `/audit-logs` | AuditLogPage | ADMIN, ACADEMIC_STAFF |
| `/students` | StudentsPage | ACADEMIC_STAFF, MANAGER |
| `/classes`, `/classes/:id` | ClassesPage, ClassDetailPage | ACADEMIC_STAFF, MANAGER |
| `/enrollments`, `/transfer` | EnrollmentsPage | ACADEMIC_STAFF |
| `/teachers`, `/teacher-assignments` | TeachersPage, AssignmentsPage | ACADEMIC_STAFF, MANAGER |
| `/parameters` | ParametersPage | ADMIN, ACADEMIC_STAFF, MANAGER |
| `/scores`, `/scores/sheets/:id` | ScoreSheetsPage, ScoreEntryPage | ACADEMIC_STAFF, TEACHER |
| `/score-entry` | ScoreSheetsPage (mode=entry) | TEACHER |
| `/score-change-requests` | ScoreChangeRequestsPage | ACADEMIC_STAFF, TEACHER |
| `/reports` | ReportsPage | ACADEMIC_STAFF, MANAGER |
| `/semester-finalize` | SemesterFinalizePage | ACADEMIC_STAFF |
| `/year-end` | YearEndPage | ACADEMIC_STAFF, MANAGER |
| `/timetable` | TimetablePage | ACADEMIC_STAFF |
| `/my-timetable` | MyTimetablePage (GET /timetable/my) | TEACHER, STUDENT |
| `/conduct-assessment` | ConductAssessmentPage | TEACHER |
| `/conduct-review` | ConductReviewPage | ACADEMIC_STAFF |
| `/my-assignments` | MyTeacherAssignmentsPage | TEACHER |
| `/class-report` | ClassReportPage | TEACHER |
| `/subject-report` | SubjectReportPage | TEACHER |
| `/my-profile` | MyProfilePage | STUDENT |
| `/my-scores` | MyScoresPage | STUDENT |

## API layer

Tất cả API call đi qua `frontend/src/lib/academic-api.ts`. File này export các function theo module (auth, students, classes, scores...) và tất cả TypeScript types của response.

Backend base URL lấy từ `VITE_API_BASE_URL`. Token JWT được đọc từ Zustand store và tự động gắn vào header `Authorization: Bearer`.

## Phân quyền frontend

- `ProtectedRoute` kiểm tra role từ auth store trước khi render page.
- Menu sidebar ẩn/hiện theo role.
- Backend vẫn enforce phân quyền độc lập — frontend ẩn menu là UX, không phải security.

## Build

```bash
npm run build
```

Output tại `dist/`. Build check cũng kiểm tra TypeScript — nếu có lỗi type sẽ fail.
