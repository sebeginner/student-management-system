# Student Management System

Phan mem quan ly hoc sinh cap 3 cho do an SE104.

## Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL, JWT.
- Frontend: React, Vite, TypeScript, React Router, Zustand, Tailwind CSS.

## Yeu cau

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Chay backend

```bash
cd backend
npm install
cp .env.example .env
```

Cap nhat `backend/.env`:

```env
PORT=3000
JWT_SECRET=replace-me-please-change-this
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_management?schema=public"
```

Tao database neu chua co:

```bash
createdb -U postgres student_management
```

Chay migration va seed:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Neu can reset sach de demo:

```bash
npx prisma migrate reset --force
npm run prisma:seed
```

Khoi dong backend:

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api`

## Chay frontend

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Khoi dong frontend:

```bash
npm run dev
```

Frontend mac dinh chay tai `http://localhost:5173`.

## Build check

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Tai khoan demo

| Vai tro | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Giao vu | `giaovu01` | `Staff@123` |
| BGH/Manager | `manager01` | `Manager@123` |
| Giao vien GVCN + GVBM Toan 10A1 | `teacher01` | `Teacher@123` |
| Giao vien GVBM Van 10A1 | `teacher02` | `Teacher@123` |
| Hoc sinh | `student01` | `Student@123` |

## Du lieu demo seed

- Nam hoc: `2025-2026`
- Hoc ky: `HK1`, `HK2`
- Lop demo: `10A1`, `10A2`, `11A1`
- Mon demo: `Toan`, `Van`
- `student01..student05` da thuoc lop `10A1`
- `student06` dang cho phan lop
- `student07` da thuoc lop `10A2`
- `teacher01`: GVCN `10A1`, GVBM `Toan 10A1 HK1`
- `teacher02`: GVBM `Van 10A1 HK1`
- Bang diem Toan/Van 10A1 HK1 co san o trang thai nhap diem demo.
- Co the demo chuyen lop tu `10A1` sang `10A2`, va demo loi khi chuyen sang `11A1`.

## Demo flow ngan

1. Dang nhap `giaovu01`, xem danh sach hoc sinh va lop `10A1`.
2. Vao phan cong giao vien, xac nhan `teacher01` la GVCN `10A1` va GVBM `Toan 10A1 HK1`.
3. Dang nhap `teacher01`, vao `Score Entry`, nhap/cap nhat diem Toan cho hoc sinh lop `10A1`.
4. `teacher01` submit bang diem Toan.
5. Dang nhap `giaovu01`, mo chi tiet bang diem Toan va lock bang diem.
6. Dang nhap `teacher01`, tao yeu cau sua diem sau khi bang diem da lock.
7. Dang nhap `giaovu01`, vao `Score Change Requests`, approve yeu cau.
8. Dang nhap `student01`, vao `My Scores` de xem diem ca nhan da cap nhat.
9. Dang nhap `manager01`, vao `Reports` de xem dashboard va bao cao tong hop.

## Phan quyen can nho khi demo

- Hoc sinh chi xem diem cua chinh minh qua `/scores/my-scores`.
- `teacher02` khong duoc xem/sua bang diem Toan cua `teacher01`.
- GVCN chi xem bao cao/lop chu nhiem; khong sua diem mon minh khong duoc phan cong GVBM.
- GVBM chi nhap/sua/xem report trong pham vi lop, mon, hoc ky duoc phan cong.

Chi tiet script thuyet trinh nam o `docs/final-demo-script.md`.
