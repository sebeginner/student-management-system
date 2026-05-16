# Student Management System

Hệ thống quản lý học sinh cấp 3 — Đồ án môn **SE104 Nhập môn Công nghệ phần mềm**.

---

## Tính năng chính

- Đăng nhập và phân quyền theo vai trò (Admin, Giáo vụ, BGH, Giáo viên, Học sinh)
- Quản lý học sinh, lớp học, năm học, học kỳ, môn học
- Phân lớp và chuyển lớp học sinh
- Phân công giáo viên chủ nhiệm và giáo viên bộ môn
- Nhập điểm, khóa bảng điểm, yêu cầu sửa điểm
- Tra cứu điểm cá nhân và điểm theo lớp
- Báo cáo tổng kết môn và tổng kết học kỳ

---

## Yêu cầu hệ thống

- [Node.js](https://nodejs.org) v18 trở lên
- [PostgreSQL](https://www.postgresql.org) v14 trở lên
- npm v9 trở lên

---

## Cài đặt và chạy

### 1. Clone repo

```bash
git clone https://github.com/sebeginner/student-management-system.git
cd student-management-system
```

### 2. Cài đặt dependencies

```bash
cd backend
npm install
```

### 3. Tạo file môi trường

```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin database:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/student_management?schema=public"
JWT_SECRET=your-secret-key-here
```

### 4. Tạo database

Mở psql hoặc pgAdmin và chạy:

```sql
CREATE DATABASE student_management;
```

Hoặc qua terminal:

```bash
psql -U postgres -c "CREATE DATABASE student_management;"
```

### 5. Chạy migration

```bash
npx prisma migrate dev --name init
```

### 6. Seed dữ liệu demo

```bash
npx prisma db seed
```

### 7. Khởi động backend

```bash
npm run start:dev
```

Backend chạy tại: http://localhost:3000

API documentation (Swagger): http://localhost:3000/api

---

### 8. Khởi động frontend

Mở terminal mới:

```bash
cd ../frontend
npm install
npm run dev
```

Frontend chạy tại: http://localhost:5173

---

## Tài khoản demo

| Vai trò | Username | Password |
|---|---|---|
| Quản trị viên | `admin` | `Admin@123` |
| Giáo vụ | `giaovu01` | `Staff@123` |
| Ban giám hiệu | `manager01` | `Manager@123` |
| Giáo viên (GVCN + GVBM Toán) | `teacher01` | `Teacher@123` |
| Giáo viên (GVBM Văn) | `teacher02` | `Teacher@123` |
| Học sinh | `student01` | `Student@123` |

---

## Dữ liệu demo có sẵn

- **Năm học:** 2025-2026 (đang hoạt động), 2024-2025
- **Học kỳ:** HK1, HK2
- **Khối lớp:** 10, 11, 12
- **Lớp:** 10A1 (5 học sinh), 10A2, 11A1, 12A1
- **Môn học:** Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin, GDCD, Thể dục
- **Bảng điểm:** Toán 10A1 HK1 — trạng thái DRAFT, có điểm mẫu

---

## Cấu trúc project

```
student-management-system/
├── backend/                  # NestJS API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Dữ liệu demo
│   │   └── migrations/       # Lịch sử migration
│   ├── src/
│   │   ├── auth/             # Đăng nhập, JWT, phân quyền
│   │   ├── users/            # Quản lý tài khoản
│   │   ├── students/         # Quản lý học sinh
│   │   ├── teachers/         # Quản lý giáo viên
│   │   ├── classes/          # Quản lý lớp học
│   │   ├── scores/           # Nhập điểm, bảng điểm
│   │   ├── reports/          # Báo cáo tổng kết
│   │   └── ...
│   └── .env.example
├── frontend/                 # React + Vite
│   └── src/
│       ├── features/         # Màn hình theo chức năng
│       ├── components/       # Component dùng chung
│       └── routes/           # Định tuyến
├── docs/                     # Tài liệu dự án
└── README.md
```

---

## Stack kỹ thuật

**Backend**
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

**Frontend**
- React + Vite + TypeScript
- React Router
- TanStack Query
- Tailwind CSS

---

## Kịch bản demo

1. Đăng nhập `admin` → xem quản lý tài khoản
2. Đăng nhập `giaovu01` → tiếp nhận học sinh → phân lớp → phân công giáo viên → khóa bảng điểm → xem báo cáo
3. Đăng nhập `teacher01` → xem lớp chủ nhiệm → nhập điểm Toán 10A1
4. Đăng nhập `teacher02` → nhập điểm Văn 10A1
5. Đăng nhập `student01` → tra cứu điểm cá nhân
6. Đăng nhập `manager01` → xem báo cáo tổng kết

---

## Nhóm thực hiện

Đồ án SE104 — Nhập môn Công nghệ phần mềm  
Trường Đại học Công nghệ Thông tin, ĐHQG TP.HCM