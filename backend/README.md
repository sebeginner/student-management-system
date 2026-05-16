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

Seed data includes school year `2025-2026`, semesters `HK1/HK2`, grade level `10`, class `10A1`, subjects `Toan/Van`, teacher assignments, five students, sample score sheets, and system parameters.

## Verification

```bash
npm run build
npm test
npm run test:e2e
```
