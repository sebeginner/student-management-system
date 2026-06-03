# Student Management System — SE104

Phần mềm quản lý học sinh cấp 3 cho đồ án SE104.

## Stack kỹ thuật

| Tầng | Công nghệ |
|---|---|
| Backend | NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT |
| Frontend | React, Vite, TypeScript, React Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui |
| Database | PostgreSQL 14+ |
| Công cụ | ESLint, Prettier, Swagger/OpenAPI |

## Yêu cầu môi trường

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Cài đặt và chạy

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Cập nhật `backend/.env`:

```env
PORT=3000
JWT_SECRET=replace-me-please-change-this
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_management?schema=public"
```

Tạo database nếu chưa có:

```bash
createdb -U postgres student_management
```

Chạy migration và seed:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Nếu cần reset sạch để demo:

```bash
npx prisma migrate reset --force
npm run prisma:seed
```

Khởi động backend:

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Khởi động frontend:

```bash
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

### Chạy nhanh (Windows)

```bat
start-demo.bat
```

Mở 2 cửa sổ CMD (backend + frontend). Đợi ~10 giây rồi mở trình duyệt.

## Build check

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Tài khoản demo

| Vai trò | Username | Password | Họ tên | Ghi chú |
|---|---|---|---|---|
| Admin | `admin` | `Admin@123` | Quản trị viên | Quản lý tài khoản, role, tham số |
| Giáo vụ | `giaovu01` | `Staff@123` | Giáo vụ Hoài | Toàn quyền nghiệp vụ học vụ |
| Ban giám hiệu | `manager01` | `Manager@123` | Phó Hiệu trưởng | Chỉ xem báo cáo |
| GVCN 10A1 + GVBM Toán | `teacher01` | `Teacher@123` | Nguyễn Tuấn An | Dạy Toán 10A1, 10A2 |
| GVCN 10A2 + GVBM Văn | `teacher02` | `Teacher@123` | Trần Thị Bích Ngọc | Dạy Văn 10A1, 10A2 |
| GVCN 11A1 + GVBM Anh | `teacher03` | `Teacher@123` | Lê Văn Cường | Dạy Anh 10A1, 11A1 |
| GVCN 12A1 + GVBM Vật lý | `teacher04` | `Teacher@123` | Phạm Thị Duyên | Dạy Vật lý 10A1, 11A1, 12A1 |
| GVBM Hóa học | `teacher05` | `Teacher@123` | Hoàng Minh Đức | Dạy Hóa 10A1, 10A2 — không CN |
| Học sinh lớp 10A1 | `student01`–`student05` | `Student@123` | Nguyễn Văn An, ... | Đã thuộc lớp 10A1 |
| Học sinh lớp 10A2 | `student07` | `Student@123` | Bùi Quốc Minh | Đã thuộc lớp 10A2 |
| Học sinh chờ phân lớp | `student06` | `Student@123` | Đỗ Ngọc Lan | Chưa có lớp |

> **Lưu ý:** GVCN và GVBM **không phải role riêng**. Cả 5 giáo viên đều đăng nhập với role `TEACHER`. Vai trò GVCN/GVBM được xác định qua bảng `TeacherAssignment` (`assignmentType = HOMEROOM` hoặc `SUBJECT`).

## Dữ liệu demo seed

- **Năm học:** `2025-2026` (đang hoạt động)
- **HK1:** 01/09/2025 – 15/01/2026 (đã kết thúc)
- **HK2:** 16/01/2026 – 30/05/2026 (đang tiến hành — active)
- **Lớp:** `10A1` (20 hs), `10A2` (15 hs), `11A1` (15 hs), `11A2` (12 hs), `12A1` (8 hs) + 3 học sinh chờ phân lớp
- **Môn học:** Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học
- **Bảng điểm HK1:** đa dạng trạng thái — `LOCKED`, `SUBMITTED`, `DRAFT`
- **Bảng điểm HK2:** Toán/10A1 (DRAFT 10/20 hs), Văn/10A1 (DRAFT 8/20 hs)
- **Yêu cầu sửa điểm:** 1 PENDING (Toán/HK1/S003), 1 APPROVED (Văn/HK1/S001)
- **Kết quả HK1:** đã chốt cho lớp 10A1 (`SemesterStudentResult`)
- **Thời khóa biểu:** lớp 10A1 HK2 đã có sẵn 11 tiết

## Demo flow ngắn

1. Đăng nhập `giaovu01` → xem danh sách học sinh, lớp `10A1`.
2. Vào phân công giáo viên, xác nhận `teacher01` là GVCN `10A1` và GVBM Toán.
3. Đăng nhập `teacher01` → **Nhập bảng điểm** → chọn Toán/10A1/HK2 → nhập điểm.
4. `teacher01` nộp bảng điểm (DRAFT → SUBMITTED).
5. Đăng nhập `giaovu01` → mở bảng điểm SUBMITTED → **Khóa bảng điểm** (→ LOCKED).
6. Đăng nhập `teacher01` → tạo yêu cầu sửa điểm trên bảng điểm đã khóa.
7. Đăng nhập `giaovu01` → vào **Yêu cầu sửa điểm** → duyệt yêu cầu.
8. Đăng nhập `student01` → vào **Điểm của tôi** → xem điểm cá nhân.
9. Đăng nhập `manager01` → vào **Báo cáo** → xem dashboard và báo cáo tổng hợp.

## Phân quyền cần nhớ khi demo

- Học sinh chỉ xem điểm của chính mình qua `/scores/my-scores`.
- `teacher02` không được xem/sửa bảng điểm Toán của `teacher01`.
- GVCN chỉ xem báo cáo/lớp chủ nhiệm; không sửa điểm môn mình không được phân công GVBM.
- GVBM chỉ nhập/sửa/xem report trong phạm vi lớp, môn, học kỳ được phân công.
- Chỉ Giáo vụ (`ACADEMIC_STAFF`) được khóa bảng điểm và duyệt yêu cầu sửa điểm.

Chi tiết script thuyết trình nằm ở `docs/final-demo-script.md`.  
Hướng dẫn demo đầy đủ nằm ở `DEMO.md`.
