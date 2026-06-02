# Student Management System Backend

NestJS + Prisma + PostgreSQL backend for the SE104 high school student management demo.

## Requirements

- Node.js
- PostgreSQL
- npm

## Setup

Install dependencies:

```bash
npm install
```

Create environment file:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local PostgreSQL connection and JWT settings:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/student_management_system?schema=public"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="8h"
PORT=3000
```

Generate Prisma Client, run migrations, then seed demo data:

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

For a local clean reset during demo preparation:

```bash
npx prisma migrate reset --force
npm run prisma:seed
```

Start the backend:

```bash
npm run start:dev
```

Start the frontend in a second terminal:

```bash
cd ../frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` and uses
`VITE_API_BASE_URL=http://localhost:3000/api/v1` by default.

## URLs

- API base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api`

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Giao vu | `giaovu01` | `Staff@123` |
| Manager/BGH | `manager01` | `Manager@123` |
| Teacher | `teacher01` | `Teacher@123` |
| Teacher | `teacher02` | `Teacher@123` |
| Student | `student01` to `student05` | `Student@123` |

Seed data includes school year `2025-2026`, semesters `HK1/HK2`, classes `10A1`, `10A2`, `11A1`, subjects `Toan/Van`, teacher assignments, seven students, sample score sheets, and system parameters. `student06` is pending class assignment and `student07` is already in `10A2`.

## Final demo flow

1. Login `giaovu01` and view students/classes. Confirm students are in `10A1`.
2. Confirm `teacher01` is homeroom teacher of `10A1` and subject teacher for `Toan 10A1 HK1`.
3. Login `teacher01`, enter Toan scores for `10A1`, then submit the score sheet.
4. Login `giaovu01`, lock the submitted Toan score sheet.
5. Login `teacher01`, create a score change request after the sheet is locked.
6. Login `giaovu01`, approve the score change request.
7. Login `student01`, view personal scores.
8. Login `manager01`, view reports.

The detailed presentation script is in `../docs/final-demo-script.md`.

## Verification

```bash
npm run build
npm test
npm run test:e2e
```
