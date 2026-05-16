# Demo flow P0

Use Swagger at `http://localhost:3000/api` or Postman with base URL `http://localhost:3000/api/v1`.

## 1. Login as Giao vu

```http
POST /auth/login
```

Body:

```json
{
  "username": "giaovu01",
  "password": "Staff@123"
}
```

Copy `accessToken` and use it as `Authorization: Bearer <token>`.

## 2. View academic data

Call:

```http
GET /students
GET /classes
GET /classes/1/students
GET /teacher-assignments
```

Expected demo data:

- Class `10A1`.
- Students `student01` to `student05`.
- `teacher01` is homeroom teacher of `10A1` and subject teacher for `Toan`.
- `teacher02` is subject teacher for `Van`.

## 3. Confirm or create teacher assignment

Seed already includes the main assignments. To demo creation, use Giao vu:

```http
POST /teacher-assignments
```

For homeroom, `assignmentType = HOMEROOM`, `subjectId = null`, `semesterId` can be null.
For subject teacher, `assignmentType = SUBJECT`, `subjectId` and `semesterId` are required.

## 4. Login as teacher01 and input Toan scores

Login:

```http
POST /auth/login
```

Body:

```json
{
  "username": "teacher01",
  "password": "Teacher@123"
}
```

Find score sheet:

```http
GET /scores/sheets
```

Update one student score:

```http
PUT /scores/sheets/{sheetId}/students/{studentId}
```

Example body:

```json
{
  "oralScores": [8, 9],
  "onePeriodScores": [7.5],
  "midtermScore": 8,
  "finalScore": 8.5
}
```

The subject average follows AGENTS.md:

```text
(avgOral * 1 + avgOnePeriod * 2 + midtermScore * 3 + finalScore * 3) / 9
```

## 5. Submit score sheet

As `teacher01`:

```http
POST /scores/sheets/{sheetId}/submit
```

The score sheet changes from `DRAFT` to `SUBMITTED` after required scores are present.

## 6. Lock score sheet as Giao vu

Login again as `giaovu01` or use the saved token:

```http
POST /scores/sheets/{sheetId}/lock
```

Expected result: status becomes `LOCKED`. After this, GVBM cannot edit scores directly.

## 7. Create score change request as teacher01

As `teacher01`:

```http
POST /score-change-requests
```

Example body:

```json
{
  "scoreSheetId": 1,
  "studentId": 1,
  "scoreType": "FINAL",
  "oldValue": 8.5,
  "newValue": 9,
  "reason": "Corrected final score after review"
}
```

Expected result: request status is `PENDING`.

## 8. Approve request as Giao vu

As `giaovu01`:

```http
POST /score-change-requests/{requestId}/approve
```

Expected result:

- Request status becomes `APPROVED`.
- The score value is updated.
- `subjectAverage` is recalculated.

Reject flow:

```http
POST /score-change-requests/{requestId}/reject
```

Body:

```json
{
  "rejectReason": "Evidence is not sufficient"
}
```

## 9. Student views personal scores

Login:

```http
POST /auth/login
```

Body:

```json
{
  "username": "student01",
  "password": "Student@123"
}
```

Call:

```http
GET /scores/my-scores
GET /reports/student-semester/1?semesterId=1
```

Expected result: student only sees their own scores and personal semester report.

## 10. Manager views reports

Login:

```json
{
  "username": "manager01",
  "password": "Manager@123"
}
```

Call:

```http
GET /reports/class-semester?classId=1&semesterId=1
GET /reports/subject-summary?classId=1&subjectId=1&semesterId=1
GET /reports/dashboard-summary?semesterId=1
```

Expected result: manager can view whole-school and class/subject summaries, but cannot edit scores or academic records.
