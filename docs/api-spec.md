# API Spec — Student Management System SE104

Tài liệu này mô tả toàn bộ endpoint thực tế đã implement trong backend, bám theo các controller trong `backend/src/`.

Swagger UI đầy đủ: `http://localhost:3000/api`

## 1. Quy ước chung

**Base URL:**

```text
http://localhost:3000/api/v1
```

Mọi endpoint (trừ đăng nhập) yêu cầu header:

```http
Authorization: Bearer <accessToken>
```

**Response thành công:**

```json
{ "data": {}, "message": "Success" }
```

**Response phân trang:**

```json
{ "data": [], "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 } }
```

**Response lỗi:**

```json
{ "statusCode": 400, "message": "Mô tả lỗi", "error": "Bad Request" }
```

**HTTP status convention:**

| Status | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu không hợp lệ / vi phạm business rule |
| 401 | Chưa đăng nhập hoặc token sai |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 409 | Trùng dữ liệu |
| 500 | Lỗi hệ thống |

---

## 2. Auth

### POST `/auth/login`

Đăng nhập — **public, không cần token**.

Request:

```json
{ "username": "giaovu01", "password": "Staff@123" }
```

Response 200:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "user": {
    "id": 2,
    "username": "giaovu01",
    "email": "giaovu01@school.com",
    "fullName": "Giáo vụ Hoài",
    "role": "ACADEMIC_STAFF",
    "studentId": null,
    "teacherId": null
  }
}
```

JWT hết hạn sau 8 giờ. Phase hiện tại chưa dùng refresh token.

### POST `/auth/logout`

Đăng xuất — backend trả success, frontend xóa token ở client.

Response 200: `{ "message": "Logout success" }`

### GET `/auth/me`

Lấy thông tin user đang đăng nhập.

Response 200: thông tin user (id, username, email, fullName, role, studentId, teacherId).

---

## 3. Users

> Tất cả endpoint yêu cầu role `ADMIN`.

### GET `/users`

Query: `role`, `status`, `q` (tìm theo username/fullName/email).

### POST `/users`

Request:

```json
{
  "username": "newteacher",
  "email": "newteacher@school.com",
  "password": "Teacher@123",
  "fullName": "Giáo viên mới",
  "roleId": 4,
  "teacherId": 6
}
```

### GET `/users/:id`

Lấy chi tiết user theo id.

### PATCH `/users/:id`

Cập nhật thông tin user (fullName, email, status, roleId).

### POST `/users/:id/reset-password`

Đặt lại mật khẩu cho user.

Request: `{ "newPassword": "NewPass@123" }`

> **Lưu ý:** Phương thức là `POST`, không phải `PATCH`.

---

## 4. Students

> `ACADEMIC_STAFF`: tạo/cập nhật/xóa và xem toàn bộ.  
> `MANAGER`, `TEACHER`: xem theo scope (GVCN xem lớp CN, GVBM xem lớp dạy).  
> `STUDENT`: chỉ xem hồ sơ của chính mình.

### GET `/students`

Query: `q` (mã/tên/email), `status` (ACTIVE/PENDING_CLASS_ASSIGNMENT/INACTIVE), `classId`, `gradeLevelId`.

### POST `/students`

Request:

```json
{
  "studentCode": "S999",
  "fullName": "Nguyễn Thị Mới",
  "gender": "FEMALE",
  "dateOfBirth": "2009-05-15",
  "address": "TP.HCM",
  "email": "new@school.com",
  "admissionDate": "2025-09-01",
  "note": "Học sinh mới"
}
```

Business rules: `studentCode` duy nhất; tuổi trong `[minAge, maxAge]`; email đúng định dạng nếu có.

### GET `/students/:id`

Chi tiết học sinh.

### PATCH `/students/:id`

Cập nhật hồ sơ học sinh (ACADEMIC_STAFF only).

### DELETE `/students/:id`

Xóa mềm học sinh — nếu đã có enrollment/điểm thì chuyển `status = INACTIVE` (ACADEMIC_STAFF only).

### GET `/students/:id/enrollments`

Lịch sử phân lớp của học sinh.

---

## 5. Năm học, học kỳ, khối, môn học

> `GET` cho tất cả role đã đăng nhập.  
> `POST`/`PATCH` chỉ cho `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`.

### Academic Years

```http
GET   /academic-years
POST  /academic-years
GET   /academic-years/:id
PATCH /academic-years/:id
```

Request `POST /academic-years`:

```json
{
  "name": "2025-2026",
  "startYear": 2025,
  "endYear": 2026,
  "startDate": "2025-09-01",
  "endDate": "2026-05-30",
  "isActive": true
}
```

### Semesters

```http
GET   /semesters
POST  /semesters
GET   /semesters/:id
PATCH /semesters/:id
```

Request `POST /semesters`:

```json
{
  "name": "HK1",
  "schoolYearId": 1,
  "startDate": "2025-09-01",
  "endDate": "2026-01-15",
  "isActive": false
}
```

### Grade Levels

```http
GET   /grade-levels
POST  /grade-levels
GET   /grade-levels/:id
PATCH /grade-levels/:id
```

Trường `level` có ràng buộc `@unique`. Ví dụ: `{ "name": "10", "level": 10 }`.

### Subjects

```http
GET   /subjects
POST  /subjects
PATCH /subjects/:id
```

Request `POST /subjects`:

```json
{
  "subjectCode": "MATH",
  "name": "Toán",
  "coefficient": 1,
  "isActive": true
}
```

---

## 6. Classes

> `ACADEMIC_STAFF`: tạo/cập nhật.  
> `ADMIN`, `MANAGER`: xem toàn trường.  
> `TEACHER`: xem lớp được phân công HOMEROOM hoặc SUBJECT.  
> `STUDENT`: xem lớp hiện tại.

```http
GET   /classes
POST  /classes
GET   /classes/:id
PATCH /classes/:id
GET   /classes/:id/students?semesterId=
```

Request `POST /classes`:

```json
{
  "classCode": "10A1",
  "name": "10A1",
  "maxSize": 40,
  "gradeLevelId": 1,
  "schoolYearId": 1,
  "homeroomTeacherId": 1
}
```

Rules:
- Tên lớp unique trong cùng năm học.
- Sĩ số không vượt `maxClassSize`.
- `GET /classes/:id/students` trả học sinh có enrollment `ACTIVE` trong học kỳ được chỉ định.

Error keys: `CLASS_NOT_FOUND`, `CLASS_NAME_EXISTS`, `CLASS_FULL`, `INVALID_GRADE_LEVEL`.

---

## 7. Enrollments (Phân lớp / Chuyển lớp)

> `ACADEMIC_STAFF`: phân lớp, chuyển lớp.  
> Các role khác: xem theo scope.

```http
GET  /enrollments
POST /enrollments/assign
POST /enrollments/transfer
GET  /students/:id/enrollments
```

Request `POST /enrollments/assign`:

```json
{
  "studentId": 1,
  "classId": 1,
  "semesterId": 1,
  "reason": "Phân lớp đầu năm"
}
```

Request `POST /enrollments/transfer`:

```json
{
  "studentId": 1,
  "fromClassId": 1,
  "toClassId": 2,
  "semesterId": 1,
  "reason": "Chuyển lớp theo yêu cầu"
}
```

Rules:
- Một học sinh chỉ có một enrollment `ACTIVE` trong cùng học kỳ.
- Không vượt `Class.maxSize`.
- Chuyển lớp trong phase hiện tại chỉ cho phép cùng khối.
- Khi chuyển: enrollment cũ → `TRANSFERRED` + `endedAt`; enrollment mới → `ACTIVE`.
- Backend cập nhật `currentSize` của cả hai lớp trong transaction.

Error keys: `STUDENT_NOT_FOUND`, `CLASS_NOT_FOUND`, `CLASS_FULL`, `STUDENT_ALREADY_ENROLLED`, `INVALID_TRANSFER_DIFFERENT_GRADE`.

---

## 8. Teachers

> `ACADEMIC_STAFF`: tạo/cập nhật.  
> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`: xem danh sách.  
> `TEACHER`: chỉ xem hồ sơ của chính mình.

```http
GET   /teachers
POST  /teachers
GET   /teachers/:id
PATCH /teachers/:id
```

Request `POST /teachers`:

```json
{
  "teacherCode": "T006",
  "fullName": "Nguyễn Văn Giáo",
  "subjectId": 1,
  "email": "t006@school.com",
  "phone": "0900000006",
  "status": "ACTIVE"
}
```

---

## 9. Teacher Assignments (Phân công GVCN/GVBM)

> `ACADEMIC_STAFF`: tạo/cập nhật phân công.  
> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`: xem toàn bộ.  
> `TEACHER`: xem phân công của chính mình qua `GET /me/teacher-assignments`.

```http
GET   /teacher-assignments
POST  /teacher-assignments
GET   /teacher-assignments/:id
PATCH /teacher-assignments/:id
GET   /teachers/:id/assignments
GET   /me/teacher-assignments
```

> **Quan trọng:** Dùng một endpoint `POST /teacher-assignments` duy nhất, phân biệt loại qua trường `assignmentType`.

Request phân công GVCN (HOMEROOM):

```json
{
  "teacherId": 1,
  "classId": 1,
  "schoolYearId": 1,
  "assignmentType": "HOMEROOM",
  "subjectId": null,
  "semesterId": null,
  "isActive": true
}
```

Request phân công GVBM (SUBJECT):

```json
{
  "teacherId": 1,
  "classId": 1,
  "schoolYearId": 1,
  "subjectId": 1,
  "semesterId": 1,
  "assignmentType": "SUBJECT",
  "isActive": true
}
```

Rules:
- `HOMEROOM`: `subjectId = null`, `semesterId = null` (áp dụng cả năm học).
- `SUBJECT`: `subjectId` và `semesterId` bắt buộc.
- Một lớp chỉ có một GVCN active trong cùng năm học.
- Một lớp/môn/học kỳ chỉ có một GVBM chính active.

Query params `GET /teacher-assignments`: `teacherId`, `classId`, `schoolYearId`, `semesterId`, `subjectId`, `assignmentType`, `isActive`.

Error keys: `TEACHER_NOT_FOUND`, `HOMEROOM_ALREADY_ASSIGNED`, `SUBJECT_TEACHER_ALREADY_ASSIGNED`.

---

## 10. System Parameters (Tham số hệ thống)

> `GET` cho tất cả role đã đăng nhập.  
> `PATCH` chỉ `ADMIN`, `ACADEMIC_STAFF` (MANAGER **không** được sửa — `MANAGE_ACADEMIC_ROLES = ['ADMIN', 'ACADEMIC_STAFF']`).

```http
GET   /system-parameters
PATCH /system-parameters/:id
```

> **Lưu ý:** Đường dẫn là `/system-parameters`, không phải `/parameters`.

Request `PATCH /system-parameters/:id`:

```json
{
  "minAge": 15,
  "maxAge": 20,
  "maxClassSize": 40,
  "minScore": 0,
  "maxScore": 10,
  "subjectPassScore": 5,
  "semesterPassScore": 5
}
```

---

## 11. Scores (Bảng điểm)

> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`: xem bảng điểm (scope theo phân công).  
> `ACADEMIC_STAFF`, `TEACHER`: tạo bảng điểm, nhập điểm, submit, lock, unlock.  
> `STUDENT`: chỉ xem điểm cá nhân qua `GET /scores/my-scores`.

```http
GET  /scores/sheets
POST /scores/sheets
GET  /scores/sheets/:id
PUT  /scores/sheets/:id/students/:studentId
POST /scores/sheets/:id/submit
POST /scores/sheets/:id/lock
POST /scores/sheets/:id/unlock
GET  /scores/my-scores
GET  /scores/sheets/:id/pdf
```

Query `GET /scores/sheets`: `classId`, `subjectId`, `semesterId`, `status`.

Request `POST /scores/sheets`:

```json
{ "classId": 1, "subjectId": 1, "semesterId": 1 }
```

Request `PUT /scores/sheets/:id/students/:studentId`:

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

Công thức tính điểm (theo AGENTS.md):

```text
avgOral      = trung bình các điểm ORAL_15M
avgOnePeriod = trung bình các điểm ONE_PERIOD
subjectAvg   = (avgOral * 1 + avgOnePeriod * 2 + midterm * 3 + final * 3) / 9
```

Workflow bảng điểm:

```
DRAFT → (GVBM submit) → SUBMITTED → (Giáo vụ lock) → LOCKED
LOCKED → (ngoại lệ) → NEEDS_CORRECTION → (fix) → SUBMITTED → LOCKED
```

Rules:
- Submit: GVBM phải có `MIDTERM` và `FINAL` cho toàn bộ học sinh active trong lớp.
- Lock: chỉ `ACADEMIC_STAFF` được khóa bảng điểm (theo business rule AGENTS.md).
- Sau khi LOCKED, GVBM không sửa trực tiếp — phải dùng `score-change-requests`.
- `unlock`: dành cho trường hợp ngoại lệ, không phải workflow thông thường.

`GET /scores/sheets/:id/pdf`: trả file PDF bảng điểm lớp (Content-Type: application/pdf).

Error keys: `SCORE_SHEET_NOT_FOUND`, `NOT_SUBJECT_TEACHER`, `SCORE_SHEET_LOCKED`, `SCORE_SHEET_NOT_SUBMITTED`, `SCORE_INVALID_RANGE`, `SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES`.

---

## 12. Score Change Requests (Yêu cầu sửa điểm)

> `TEACHER`: chỉ tạo yêu cầu (bắt buộc có assignment `SUBJECT` đúng lớp/môn/học kỳ).  
> `ACADEMIC_STAFF`: approve/reject (theo business rule AGENTS.md).  
> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`: xem danh sách.

```http
GET  /score-change-requests
POST /score-change-requests
GET  /score-change-requests/:id
POST /score-change-requests/:id/approve
POST /score-change-requests/:id/reject
```

Query `GET /score-change-requests`: `status` (PENDING/APPROVED/REJECTED), `scoreSheetId`.

Request `POST /score-change-requests`:

```json
{
  "scoreSheetId": 1,
  "studentSubjectScoreId": 1,
  "scoreDetailId": 1,
  "testTypeId": 3,
  "attemptNo": 1,
  "oldScore": 7.5,
  "newScore": 8.0,
  "reason": "Nhập nhầm điểm giữa kỳ"
}
```

Rules:
- Chỉ tạo khi `ScoreSheet.status = LOCKED`.
- Chỉ GVBM được phân công đúng lớp/môn/học kỳ mới tạo được.
- Không tạo trùng yêu cầu PENDING cho cùng học sinh/bảng điểm/loại điểm.

Request `POST /score-change-requests/:id/approve`:

```json
{ "reviewNote": "Đã kiểm tra minh chứng, duyệt chỉnh sửa." }
```

Request `POST /score-change-requests/:id/reject`:

```json
{ "reviewNote": "Minh chứng chưa hợp lệ." }
```

Error keys: `SCORE_CHANGE_REQUEST_NOT_FOUND`, `SCORE_CHANGE_REQUEST_DUPLICATED`, `SCORE_CHANGE_REQUEST_ALREADY_PROCESSED`, `NOT_SUBJECT_TEACHER`, `ONLY_ACADEMIC_STAFF_CAN_APPROVE`.

---

## 13. Reports (Báo cáo)

> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`: xem báo cáo toàn trường.  
> `TEACHER` HOMEROOM: xem báo cáo lớp chủ nhiệm.  
> `TEACHER` SUBJECT: xem báo cáo môn/lớp được phân công.  
> `STUDENT`: chỉ xem cá nhân qua `student-semester`.

```http
GET /reports/class-semester
GET /reports/subject-summary
GET /reports/student-semester/:studentId
GET /reports/dashboard-summary
GET /reports/student-transcript/:studentId/pdf
```

### GET `/reports/class-semester`

Query: `classId` (bắt buộc), `semesterId` (bắt buộc), `includeUnOfficial` (mặc định false).

Trả về: sĩ số, điểm TB học kỳ lớp, số đạt/chưa đạt, danh sách học sinh.

### GET `/reports/subject-summary`

Query: `subjectId` (bắt buộc), `semesterId` (bắt buộc), `classId` (tùy chọn), `includeUnOfficial`.

Response mẫu:

```json
{
  "subjectId": 1,
  "semesterId": 1,
  "details": [
    { "classId": 1, "className": "10A1", "studentCount": 20, "passCount": 18, "passRate": 90.0 }
  ]
}
```

### GET `/reports/student-semester/:studentId`

Query: `semesterId` (bắt buộc), `includeUnOfficial`.

Trả về: điểm từng môn, `semesterAverage`, PASS/FAIL.

### GET `/reports/dashboard-summary`

Query: `schoolYearId`, `semesterId`, `includeUnOfficial`.

Trả về: tổng số học sinh, tổng lớp, số bảng điểm chưa khóa, yêu cầu sửa điểm chờ duyệt, v.v.

Roles: `ADMIN`, `ACADEMIC_STAFF`, `MANAGER` (không có TEACHER).

### GET `/reports/student-transcript/:studentId/pdf`

Xuất phiếu kết quả học sinh (PDF). Roles: `ADMIN`, `ACADEMIC_STAFF`, `TEACHER`, `STUDENT`.

> **Lưu ý:** Mặc định báo cáo chỉ tính bảng điểm `LOCKED`. Truyền `includeUnOfficial=true` để xem tạm dữ liệu DRAFT/SUBMITTED (response có `isOfficial = false`).

Error keys: `REPORT_DATA_NOT_READY`, `FORBIDDEN_REPORT_SCOPE`.

---

## 14. Semester Results (Chốt kết quả học kỳ / Tổng kết năm)

> `ACADEMIC_STAFF`: chốt học kỳ, tổng kết năm.  
> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`: xem kết quả.

```http
POST /semesters/:id/finalize
GET  /semesters/:id/results
POST /school-years/:id/year-end
GET  /reports/year-end
```

### POST `/semesters/:id/finalize`

Chốt kết quả học kỳ cho tất cả học sinh đã có điểm LOCKED.  
Tính `semesterAverage`, `academicRating` (EXCELLENT/GOOD/AVERAGE/WEAK/POOR), lưu vào `SemesterStudentResult`.

### GET `/semesters/:id/results`

Query: `classId` (tùy chọn).

Trả về danh sách `SemesterStudentResult` của học kỳ.

### POST `/school-years/:id/year-end`

Tổng kết năm học: tính TB năm = (HK1×1 + HK2×2) / 3, xét lên lớp/thi lại/ở lại.  
Lưu vào `YearEndResult` với `decision` (ADVANCE/REMEDIAL/CONDUCT_REVIEW/RETAIN).

### GET `/reports/year-end`

Query: `schoolYearId` (bắt buộc), `classId` (tùy chọn).

Trả về `YearEndResult` của toàn trường hoặc theo lớp.

---

## 15. Conduct Assessments (Đánh giá hạnh kiểm — UC1)

> `TEACHER`: tạo, cập nhật, nộp hạnh kiểm của lớp chủ nhiệm.  
> `ACADEMIC_STAFF`: chốt (finalize) hạnh kiểm.  
> `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`: xem.

```http
GET  /conduct-assessments
GET  /conduct-assessments/students/:studentId
GET  /conduct-assessments/:id
POST /conduct-assessments
POST /conduct-assessments/batch
PATCH /conduct-assessments/:id
POST /conduct-assessments/:id/submit
POST /conduct-assessments/:id/finalize
```

Query `GET /conduct-assessments`: `semesterId`, `classId`.

Request `POST /conduct-assessments`:

```json
{
  "studentId": 1,
  "semesterId": 1,
  "classId": 1,
  "teacherNote": "Học sinh chăm chỉ"
}
```

Request `PATCH /conduct-assessments/:id` (cập nhật tiêu chí):

```json
{
  "criteria": [
    { "code": "ATTENDANCE",  "rating": "EXCELLENT", "note": "" },
    { "code": "DISCIPLINE",  "rating": "GOOD",      "note": "" },
    { "code": "ACADEMIC",    "rating": "GOOD",      "note": "" },
    { "code": "ACTIVITIES",  "rating": "AVERAGE",   "note": "" }
  ],
  "teacherNote": "Cần cải thiện hoạt động ngoại khóa"
}
```

Tiêu chí hạnh kiểm (`ConductCriterion.code`): `ATTENDANCE`, `DISCIPLINE`, `ACADEMIC`, `ACTIVITIES`.  
Xếp loại (`finalRating`): `EXCELLENT`, `GOOD`, `AVERAGE`, `WEAK`.

Workflow:

```
DRAFT → (TEACHER submit) → SUBMITTED → (ACADEMIC_STAFF finalize) → FINALIZED
```

`POST /conduct-assessments/batch?semesterId=1&classId=1`: tạo hạnh kiểm DRAFT cho toàn bộ học sinh trong lớp cùng lúc.

---

## 16. Timetable (Thời khóa biểu — UC5)

> `ACADEMIC_STAFF`: tạo, xóa slot.  
> Tất cả role đã đăng nhập: xem.  
> `TEACHER`, `STUDENT`: xem TKB cá nhân qua `GET /timetable/my`.

```http
GET    /timetable?semesterId=&classId=
GET    /timetable/my?semesterId=
POST   /timetable
POST   /timetable/bulk
DELETE /timetable/:id
```

Request `POST /timetable`:

```json
{
  "semesterId": 2,
  "classId": 1,
  "subjectId": 1,
  "teacherId": 1,
  "dayOfWeek": 2,
  "period": 1,
  "room": "101"
}
```

`dayOfWeek`: 1 = Thứ 2, 2 = Thứ 3, ..., 6 = Thứ 7.  
`period`: tiết học trong ngày (1–5).

`POST /timetable/bulk`: nhận mảng các slot để upsert nhiều tiết cùng lúc.

Ràng buộc unique: mỗi (semesterId, classId, dayOfWeek, period) chỉ có một slot; mỗi giáo viên không được trùng lịch cùng tiết.

---

## 17. Import (Nhập liệu Excel — UC4)

> `ADMIN`, `ACADEMIC_STAFF`: import học sinh.  
> `ADMIN`, `ACADEMIC_STAFF`, `TEACHER`: import điểm, tải template.

### Templates

```http
GET /templates/students
GET /templates/score-sheet?sheetId=
```

Trả về file Excel mẫu (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet).

### Import học sinh (2 bước)

```http
POST /students/import/preview   (multipart/form-data, field: file)
POST /students/import/commit    (JSON)
```

`preview`: phân tích file Excel, trả danh sách hàng hợp lệ/lỗi.  
`commit`: request body `{ "data": [...] }` với dữ liệu đã xác nhận từ preview.

### Import điểm (2 bước)

```http
POST /scores/sheets/:id/import/preview   (multipart/form-data, field: file)
POST /scores/sheets/:id/import/commit    (JSON)
```

---

## 18. Audit Logs (Nhật ký hệ thống — UC6)

> Roles: `ADMIN`, `ACADEMIC_STAFF`.

```http
GET /audit-logs
```

Query: `entityType`, `entityId`, `userId`, `action`, `startDate`, `endDate`, `page`, `limit`.

Trả về danh sách thao tác được ghi lại, kèm mô tả ngôn ngữ tự nhiên.
