# Demo Flow — Luồng demo API (Swagger / Postman)

Dùng Swagger UI tại `http://localhost:3000/api` hoặc Postman với base URL `http://localhost:3000/api/v1`.

Dữ liệu demo: năm học **2025-2026**, HK2 đang active. Seed đã tạo đầy đủ dữ liệu HK1 và một phần HK2.

---

## Bước 1 — Đăng nhập với Giáo vụ

```http
POST /auth/login
```

Body:

```json
{ "username": "giaovu01", "password": "Staff@123" }
```

Copy `accessToken` → dùng làm `Authorization: Bearer <token>` cho các bước tiếp theo.

---

## Bước 2 — Xem dữ liệu học vụ

```http
GET /students
GET /classes
GET /classes/1/students?semesterId=2
GET /teacher-assignments
GET /me/teacher-assignments
```

Dữ liệu mong đợi:

- ~73 học sinh; 3 học sinh trạng thái `PENDING_CLASS_ASSIGNMENT`.
- Lớp `10A1` (20 hs), `10A2` (15 hs), `11A1` (15 hs), `11A2` (12 hs), `12A1` (8 hs).
- `teacher01` là GVCN `10A1` + GVBM Toán 10A1 và 10A2 (HK1 + HK2).
- `teacher02` là GVCN `10A2` + GVBM Văn 10A1 và 10A2 (HK1 + HK2).

---

## Bước 3 — Tra cứu bảng điểm

```http
GET /scores/sheets?classId=1&semesterId=1
```

Trạng thái HK1 (semesterId=1) của lớp 10A1:

| Môn | Trạng thái | Ghi chú |
|---|---|---|
| Toán | LOCKED | Có thể xem, tạo SCR |
| Ngữ văn | LOCKED | |
| Tiếng Anh | LOCKED | |
| Vật lý | SUBMITTED | Demo khóa |
| Hóa học | DRAFT | 12/20 học sinh |

---

## Bước 4 — Demo khóa bảng điểm

Tìm bảng điểm Vật lý / 10A1 / HK1 (status = SUBMITTED):

```http
GET /scores/sheets?classId=1&subjectId=4&semesterId=1
```

Khóa bảng điểm (chỉ `ACADEMIC_STAFF`):

```http
POST /scores/sheets/{sheetId}/lock
```

Kết quả mong đợi: `status = LOCKED`.

---

## Bước 5 — Đăng nhập teacher01 và nhập điểm HK2

```http
POST /auth/login
```

Body:

```json
{ "username": "teacher01", "password": "Teacher@123" }
```

Xem bảng điểm được phân công:

```http
GET /scores/sheets
```

Mở bảng điểm Toán / 10A1 / HK2 (DRAFT):

```http
GET /scores/sheets/{sheetId}
```

Nhập điểm một học sinh:

```http
PUT /scores/sheets/{sheetId}/students/{studentId}
```

Body:

```json
{
  "details": [
    { "testTypeCode": "ORAL_15M",   "attemptNo": 1, "score": 8.0 },
    { "testTypeCode": "ONE_PERIOD", "attemptNo": 1, "score": 7.5 },
    { "testTypeCode": "MIDTERM",    "attemptNo": 1, "score": 8.0 },
    { "testTypeCode": "FINAL",      "attemptNo": 1, "score": 9.0 }
  ]
}
```

Công thức: `(8×1 + 7.5×2 + 8×3 + 9×3) / 9 ≈ 8.28`

---

## Bước 6 — Submit bảng điểm

Sau khi nhập đủ MIDTERM + FINAL cho toàn bộ học sinh:

```http
POST /scores/sheets/{sheetId}/submit
```

Kết quả: `status = SUBMITTED`.

---

## Bước 7 — Tạo yêu cầu sửa điểm (từ bảng điểm LOCKED)

Với bảng điểm Toán / 10A1 / HK1 đã LOCKED:

```http
POST /score-change-requests
```

Body:

```json
{
  "scoreSheetId": 1,
  "studentSubjectScoreId": 3,
  "testTypeId": 3,
  "attemptNo": 1,
  "oldScore": 6.5,
  "newScore": 7.0,
  "reason": "Phúc khảo bài giữa kỳ, điểm thực tế cao hơn"
}
```

Kết quả: yêu cầu ở trạng thái `PENDING`.

---

## Bước 8 — Duyệt yêu cầu sửa điểm (Giáo vụ)

Đăng nhập lại `giaovu01`:

```http
GET /score-change-requests?status=PENDING
```

Duyệt yêu cầu:

```http
POST /score-change-requests/{requestId}/approve
```

Body:

```json
{ "reviewNote": "Đã kiểm tra bảng điểm gốc. Duyệt chỉnh sửa." }
```

Kết quả:
- Yêu cầu → `APPROVED`.
- Điểm học sinh được cập nhật.
- `averageScore` tính lại.

Từ chối (nếu demo):

```http
POST /score-change-requests/{requestId}/reject
```

Body: `{ "reviewNote": "Minh chứng không đủ." }`

---

## Bước 9 — Học sinh xem điểm cá nhân

```http
POST /auth/login
```

Body: `{ "username": "student01", "password": "Student@123" }`

```http
GET /scores/my-scores
GET /reports/student-semester/1?semesterId=1
```

Kết quả: học sinh chỉ thấy điểm của chính mình (backend lấy từ JWT, không nhận studentId từ client).

---

## Bước 10 — Manager xem báo cáo

```http
POST /auth/login
```

Body: `{ "username": "manager01", "password": "Manager@123" }`

```http
GET /reports/dashboard-summary?schoolYearId=1&semesterId=2
GET /reports/class-semester?classId=1&semesterId=1
GET /reports/subject-summary?subjectId=1&semesterId=1
GET /reports/year-end?schoolYearId=1
```

---

## Bước 11 — Demo phân quyền GVBM (teacher02 không được sửa Toán)

Đăng nhập `teacher02`:

```http
POST /auth/login
```

Thử truy cập bảng điểm Toán / 10A1:

```http
GET /scores/sheets/{sheetIdCuaToán}
```

Kết quả mong đợi: Backend trả `403 NOT_SUBJECT_TEACHER` nếu teacher02 cố nhập điểm Toán.

> teacher02 chỉ được xem bảng điểm Toán/10A2 qua quyền GVCN (xem tất cả môn lớp chủ nhiệm 10A2).

---

## Bước 12 — Xem thời khóa biểu

```http
GET /timetable?semesterId=2&classId=1
```

Seed đã tạo TKB lớp 10A1 HK2: Toán(T2-4, T4-2, T6-1), Văn(T3-1, T5-1), Anh(T2-3, T4-3), VL(T3-3, T6-3), Hóa(T5-3).

Học sinh / giáo viên xem TKB cá nhân:

```http
GET /timetable/my?semesterId=2
```

---

## Bước 13 — Xem nhật ký hệ thống

```http
POST /auth/login  (admin hoặc giaovu01)
GET /audit-logs
```

Lọc theo loại: `GET /audit-logs?entityType=SCORE_SHEET&page=1&limit=20`

---

## Endpoint đã dùng trong demo (tổng hợp)

```http
POST /auth/login
GET  /auth/me
GET  /students
GET  /classes
GET  /classes/:id/students
GET  /teacher-assignments
GET  /me/teacher-assignments
GET  /scores/sheets
GET  /scores/sheets/:id
PUT  /scores/sheets/:id/students/:studentId
POST /scores/sheets/:id/submit
POST /scores/sheets/:id/lock
POST /score-change-requests
GET  /score-change-requests
POST /score-change-requests/:id/approve
POST /score-change-requests/:id/reject
GET  /scores/my-scores
GET  /reports/dashboard-summary
GET  /reports/class-semester
GET  /reports/subject-summary
GET  /reports/student-semester/:studentId
GET  /reports/year-end
GET  /timetable
GET  /timetable/my
GET  /audit-logs
```

---

## Lỗi có chủ đích để giải thích

| errorKey | Kịch bản demo | Ý nghĩa |
|---|---|---|
| `NOT_SUBJECT_TEACHER` | teacher02 thử nhập điểm Toán | Không có SUBJECT assignment đúng môn/lớp/HK |
| `SCORE_SHEET_LOCKED` | teacher01 thử sửa điểm Toán/HK1 trực tiếp | Bảng điểm đã khóa |
| `CLASS_FULL` | Phân lớp vào lớp đã đủ 40 học sinh | Sĩ số vượt tối đa |
| `STUDENT_ALREADY_ENROLLED` | Phân lớp học sinh đã có lớp active | Không có hai enrollment active cùng HK |
| `INVALID_TRANSFER_DIFFERENT_GRADE` | Chuyển từ 10A1 sang 11A1 | Chỉ chuyển trong cùng khối |
| `SCORE_CHANGE_REQUEST_DUPLICATED` | Tạo SCR thứ 2 cho cùng học sinh/loại điểm đang PENDING | Chờ xử lý yêu cầu trước |
| `ONLY_ACADEMIC_STAFF_CAN_APPROVE` | teacher01 thử duyệt SCR | Chỉ Giáo vụ duyệt được |
