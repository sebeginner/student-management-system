# Student Management System — Backend SE104

NestJS + Prisma + PostgreSQL backend cho hệ thống quản lý học sinh cấp 3.

## Stack

- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT (Passport)
- Swagger/OpenAPI (`http://localhost:3000/api`)
- bcrypt (hash password)

## Cài đặt

```bash
npm install
cp .env.example .env
```

Cập nhật `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_management?schema=public"
JWT_SECRET="replace-me-please-change-this"
JWT_EXPIRES_IN="8h"
PORT=3000
```

Generate Prisma Client, chạy migration, seed:

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

Reset sạch để demo:

```bash
npx prisma migrate reset --force
npm run prisma:seed
```

Khởi động:

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api`

## Tài khoản demo

| Vai trò | Username | Password | Ghi chú |
|---|---|---|---|
| Admin | `admin` | `Admin@123` | Quản lý tài khoản, role, tham số |
| Giáo vụ | `giaovu01` | `Staff@123` | Toàn quyền nghiệp vụ học vụ |
| Ban giám hiệu | `manager01` | `Manager@123` | Chỉ xem báo cáo |
| GVCN 10A1 + GVBM Toán | `teacher01` | `Teacher@123` | Nguyễn Tuấn An — dạy Toán 10A1, 10A2 |
| GVCN 10A2 + GVBM Văn | `teacher02` | `Teacher@123` | Trần Thị Bích Ngọc — dạy Văn 10A1, 10A2 |
| GVCN 11A1 + GVBM Anh | `teacher03` | `Teacher@123` | Lê Văn Cường — dạy Anh 10A1, 11A1 |
| GVCN 12A1 + GVBM Vật lý | `teacher04` | `Teacher@123` | Phạm Thị Duyên — dạy VL 10A1, 11A1, 12A1 |
| GVBM Hóa học | `teacher05` | `Teacher@123` | Hoàng Minh Đức — dạy Hóa 10A1, 10A2 |
| Học sinh | `student01`–`student05` | `Student@123` | Lớp 10A1 |
| Học sinh | `student07` | `Student@123` | Lớp 10A2 |
| Học sinh (chờ lớp) | `student06` | `Student@123` | Đỗ Ngọc Lan — chưa phân lớp |

> GVCN/GVBM không phải role riêng — đều là `TEACHER`. Vai trò được xác định qua `TeacherAssignment.assignmentType`.

## Seed data

- **Năm học:** `2025-2026` (isActive=true)
- **HK1:** 01/09/2025–15/01/2026 (completed)
- **HK2:** 16/01/2026–30/05/2026 (active)
- **Lớp:** 10A1(20hs), 10A2(15hs), 11A1(15hs), 11A2(12hs), 12A1(8hs) + 3 hs chờ phân lớp
- **Môn:** Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học
- **Bảng điểm HK1:** LOCKED/SUBMITTED/DRAFT (xem seed.ts để biết chi tiết)
- **Bảng điểm HK2:** Toán/10A1 (DRAFT 10/20), Văn/10A1 (DRAFT 8/20)
- **SCR:** 1 PENDING (Toán/HK1/S003), 1 APPROVED (Văn/HK1/S001)
- **Hạnh kiểm:** 5 FINALIZED + 3 SUBMITTED (lớp 10A1 HK1)
- **Thời khóa biểu:** 11 tiết lớp 10A1 HK2

## Modules backend

```
src/
  auth/                  — Đăng nhập, JWT, Guards
  users/                 — Quản lý tài khoản (ADMIN only)
  students/              — Hồ sơ học sinh
  teachers/              — Hồ sơ giáo viên
  academic-years/        — Năm học
  semesters/             — Học kỳ
  grade-levels/          — Khối lớp
  classes/               — Lớp học
  subjects/              — Môn học
  enrollments/           — Phân lớp, chuyển lớp
  teacher-assignments/   — Phân công GVCN/GVBM
  system-parameters/     — Tham số hệ thống
  scores/                — Bảng điểm, nhập điểm, lock, PDF
  score-change-requests/ — Yêu cầu sửa điểm
  reports/               — Báo cáo môn, học kỳ, dashboard, PDF
  semester-results/      — Chốt kết quả HK + tổng kết năm
  conduct-assessments/   — Hạnh kiểm
  timetable/             — Thời khóa biểu
  import/                — Import Excel (học sinh + điểm)
  audit-logs/            — Nhật ký hệ thống
  common/                — Guards, decorators, filters, utils
```

## Demo flow ngắn

1. `giaovu01`: xem học sinh, lớp, phân công GV.
2. `giaovu01`: khóa bảng điểm Vật lý/10A1/HK1 (SUBMITTED → LOCKED).
3. `giaovu01`: duyệt yêu cầu sửa điểm PENDING.
4. `teacher01`: nhập điểm Toán/10A1/HK2; submit.
5. `teacher01`: tạo yêu cầu sửa điểm trên bảng LOCKED.
6. `student01`: xem điểm cá nhân.
7. `manager01`: xem báo cáo dashboard và tổng kết.

Script thuyết trình chi tiết: `../docs/final-demo-script.md`

## Kiểm tra build

```bash
npm run build
npm test
```
