# API Spec - Student Management System MVP

## P0 backend verification status

Backend P0 modules have been verified after a clean Prisma migrate reset and seed:

- Auth: login, logout, me.
- Academic setup: academic years, semesters, grade levels, subjects, system parameters.
- Students, classes, enrollments.
- Teachers and teacher assignments.
- Scores: score sheets, input score, submit, lock, my-scores.
- Score change requests: create, list, approve/reject.
- Reports: class semester, subject summary, student semester, dashboard summary.

Swagger UI is available at `http://localhost:3000/api`.

## 1. Quy ước chung

Base URL đề xuất:

```text
http://localhost:3000/api/v1
```

Backend cần thêm global prefix trong `main.ts`:

```ts
app.setGlobalPrefix('api/v1');
```

Nếu chưa thêm global prefix thì tạm gọi trực tiếp từ root, ví dụ `http://localhost:3000/auth/login`.

## 2. Auth

### POST `/auth/login`

Đăng nhập.

Request:

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Response 200:

```json
{
  "accessToken": "jwt-token",
  "access_token": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@school.com",
    "fullName": "System Admin",
    "role": "ADMIN",
    "studentId": null,
    "teacherId": null
  }
}
```

JWT access token hết hạn sau 8 giờ. Phase đồ án hiện tại chưa dùng refresh token.

### POST `/auth/logout`

Đăng xuất. Backend trả success đơn giản; frontend xóa token ở client.

Header:

```http
Authorization: Bearer <accessToken>
```

Response 200:

```json
{
  "message": "Logout success"
}
```

### GET `/auth/me`

Lấy thông tin user hiện tại.

Header:

```http
Authorization: Bearer <access_token>
```

Response 200:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@school.com",
  "fullName": "System Admin",
  "role": "ADMIN",
  "studentId": null,
  "teacherId": null
}
```

## 3. Users

### GET `/users`

Query:

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `role` | string | Không | ADMIN/ACADEMIC_STAFF/MANAGER/TEACHER/STUDENT |
| `status` | string | Không | ACTIVE/INACTIVE/LOCKED |
| `q` | string | Không | Từ khóa username/fullName/email |

### POST `/users`

Request:

```json
{
  "username": "teacher01",
  "email": "teacher01@school.com",
  "password": "Teacher@123",
  "fullName": "Nguyễn Văn Giáo Viên",
  "roleId": 2,
  "teacherId": 1
}
```

### PATCH `/users/:id`

Cập nhật thông tin user.

### PATCH `/users/:id/status`

Request:

```json
{
  "status": "LOCKED"
}
```

## 4. Students

Các endpoint yêu cầu JWT. `ACADEMIC_STAFF` được tạo/cập nhật/xóa và xem toàn bộ; `MANAGER` được xem toàn bộ; `TEACHER` chỉ xem học sinh thuộc lớp chủ nhiệm hoặc lớp mình dạy; `STUDENT` chỉ xem hồ sơ của chính mình.

Endpoint đã implement:

```http
GET    /students?keyword=&status=&classId=&gradeLevelId=
POST   /students
GET    /students/:id
PATCH  /students/:id
DELETE /students/:id
```

Response thành công dùng format:

```json
{
  "data": {},
  "message": "Success"
}
```

Error keys nghiệp vụ:

```json
{
  "errorKey": "STUDENT_CODE_EXISTS | STUDENT_NOT_FOUND | STUDENT_AGE_INVALID | INVALID_EMAIL",
  "message": "..."
}
```

### GET `/students`

Query:

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `q` | string | Không | Tìm theo mã/tên/email |
| `status` | string | Không | ACTIVE/INACTIVE |
| `classId` | number | Không | Lọc theo lớp |

Response 200:

```json
[
  {
    "id": 1,
    "studentCode": "HS001",
    "fullName": "Nguyễn Văn An",
    "gender": "MALE",
    "dateOfBirth": "2008-05-15",
    "email": "an@example.com",
    "status": "ACTIVE"
  }
]
```

### GET `/students/:id`

Lấy chi tiết học sinh.

### POST `/students`

Request:

```json
{
  "studentCode": "HS001",
  "fullName": "Nguyễn Văn An",
  "gender": "MALE",
  "dateOfBirth": "2008-05-15",
  "address": "TP.HCM",
  "email": "an@example.com",
  "admissionDate": "2025-09-01",
  "note": "Học sinh mới"
}
```

Business rules:

- `studentCode` duy nhất.
- Tuổi nằm trong khoảng tham số `minAge` và `maxAge`.
- Email đúng định dạng nếu có.

### PATCH `/students/:id`

Cập nhật học sinh.

### PATCH `/students/:id/status`

Request:

```json
{
  "status": "INACTIVE"
}
```

### DELETE `/students/:id`

Nếu học sinh chưa có enrollment hoặc điểm, hệ thống xóa record. Nếu đã có enrollment hoặc điểm, hệ thống không xóa cứng mà chuyển `status = INACTIVE`.

## 5. Master data

Các endpoint trong nhóm này đã implement và yêu cầu JWT. `GET` cho phép `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`, `STUDENT`; `POST/PATCH` chỉ cho `ADMIN`, `ACADEMIC_STAFF`.

Response thành công dùng format:

```json
{
  "data": {},
  "message": "Success"
}
```

Endpoint hiện có:

```http
GET   /academic-years
POST  /academic-years
GET   /academic-years/:id
PATCH /academic-years/:id

GET   /semesters
POST  /semesters
GET   /semesters/:id
PATCH /semesters/:id

GET   /grade-levels
POST  /grade-levels
GET   /grade-levels/:id
PATCH /grade-levels/:id

GET   /subjects
POST  /subjects
GET   /subjects/:id
PATCH /subjects/:id
```

Request mẫu `POST /academic-years`:

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

Request mẫu `POST /semesters`:

```json
{
  "name": "HK1",
  "schoolYearId": 1,
  "startDate": "2025-09-01",
  "endDate": "2026-01-15",
  "isActive": true
}
```

Request mẫu `POST /grade-levels`:

```json
{
  "name": "10",
  "level": 10,
  "isActive": true
}
```

Request mẫu `POST /subjects`:

```json
{
  "subjectCode": "MATH",
  "name": "Toan",
  "coefficient": 1,
  "description": "Mon Toan",
  "isActive": true
}
```

### GET `/school-years`

Lấy danh sách năm học.

### GET `/semesters`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `schoolYearId` | number | Không |

### GET `/grade-levels`

Lấy khối lớp.

### GET `/subjects`

Lấy danh sách môn học.

### POST `/subjects`

Request:

```json
{
  "subjectCode": "MATH",
  "name": "Toán",
  "coefficient": 1,
  "description": "Môn Toán"
}
```

## 6. Classes and enrollments

Da implement ClassesModule:

```http
GET   /classes?schoolYearId=&gradeLevelId=&keyword=
POST  /classes
GET   /classes/:id
PATCH /classes/:id
GET   /classes/:id/students
```

Quyen:

- `ACADEMIC_STAFF`: tao/cap nhat lop, xem lop.
- `ADMIN`, `MANAGER`: xem lop.
- `TEACHER`: xem lop minh duoc phan cong `HOMEROOM` hoac `SUBJECT`.
- `STUDENT`: xem lop hien tai cua minh.

Request tao lop:

```json
{
  "className": "10A3",
  "classCode": "10A3-2025",
  "schoolYearId": 1,
  "gradeLevelId": 1,
  "maxSize": 40,
  "homeroomTeacherId": 1
}
```

Rules:

- `className`, `schoolYearId`, `gradeLevelId` bat buoc.
- Neu khong gui `maxSize`, backend lay `SystemParameter.maxClassSize`, mac dinh 40.
- `currentSize` mac dinh 0 khi tao lop.
- Khong cho trung ten lop trong cung nam hoc.
- `GET /classes/:id/students` tra ve hoc sinh co enrollment `ACTIVE` trong lop.
- Khong co DELETE lop trong P0.

Error keys:

- `CLASS_NOT_FOUND`
- `CLASS_NAME_EXISTS`
- `CLASS_FULL`
- `INVALID_GRADE_LEVEL`

Da implement EnrollmentsModule:

```http
GET  /enrollments?studentId=&classId=&semesterId=&status=
POST /enrollments/assign
POST /enrollments/transfer
GET  /students/:id/enrollments
```

Quyen:

- `ACADEMIC_STAFF`: phan lop va chuyen lop.
- `ADMIN`, `MANAGER`: xem enrollment.
- `TEACHER`: xem lich su enrollment cua lop minh la GVCN.
- `STUDENT`: xem enrollment cua chinh minh.

Request `POST /enrollments/assign`:

```json
{
  "studentId": 1,
  "classId": 1,
  "semesterId": 1,
  "reason": "Phan lop dau nam"
}
```

Request `POST /enrollments/transfer`:

```json
{
  "studentId": 1,
  "fromClassId": 1,
  "toClassId": 2,
  "semesterId": 1,
  "reason": "Chuyen lop theo yeu cau giao vu"
}
```

Rules:

- Moi hoc sinh chi co mot enrollment `ACTIVE` trong cung hoc ky.
- Phan lop/chuyen lop khong duoc vuot `Class.maxSize`.
- Chuyen lop trong phase hien tai chi cho phep cung khoi.
- Khi chuyen lop, enrollment cu duoc set `TRANSFERRED`, co `endedAt` va `reason`; enrollment moi duoc tao `ACTIVE`.
- Backend cap nhat lai `currentSize` cua lop cu va lop moi trong Prisma transaction.

Error keys:

- `STUDENT_NOT_FOUND`
- `CLASS_NOT_FOUND`
- `CLASS_FULL`
- `STUDENT_ALREADY_ENROLLED`
- `INVALID_TRANSFER_DIFFERENT_GRADE`
- `ENROLLMENT_NOT_FOUND`

### GET `/classes`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `schoolYearId` | number | Không |
| `gradeLevelId` | number | Không |
| `status` | string | Không |

### POST `/classes`

Request:

```json
{
  "classCode": "10A1-2025",
  "name": "10A1",
  "maxSize": 40,
  "gradeLevelId": 1,
  "schoolYearId": 1,
  "homeroomTeacherId": 1
}
```

### GET `/classes/:id/students`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `semesterId` | number | Có |

### POST `/classes/:id/students`

Thêm học sinh vào lớp theo học kỳ.

Request:

```json
{
  "studentId": 1,
  "semesterId": 1
}
```

Business rules:

- Lớp chưa vượt sĩ số tối đa.
- Học sinh chưa có lớp trong học kỳ đó.

### DELETE `/classes/:id/students/:studentId?semesterId=1`

Xóa học sinh khỏi lớp trong học kỳ.

## 7. Parameters

Đã implement:

```http
GET   /system-parameters
PATCH /system-parameters/:id
```

`GET` cho phép các role đăng nhập. `PATCH` chỉ cho `ADMIN`, `ACADEMIC_STAFF`.

### GET `/system-parameters`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `schoolYearId` | number | Không |

### PATCH `/system-parameters/:id`

Request:

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

## 8. Teachers and teacher assignments

Da implement TeachersModule:

```http
GET   /teachers?keyword=&subjectId=&status=
POST  /teachers
GET   /teachers/:id
PATCH /teachers/:id
```

Quyen:

- `ACADEMIC_STAFF`: tao/cap nhat giao vien.
- `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`: xem danh sach giao vien.
- `TEACHER`: chi xem ho so giao vien cua chinh minh.
- `STUDENT`: khong truy cap module giao vien/phan cong.

Request `POST /teachers`:

```json
{
  "teacherCode": "T003",
  "fullName": "Nguyen Van An",
  "subjectId": 1,
  "email": "teacher@example.com",
  "phone": "0900000000",
  "status": "ACTIVE"
}
```

Da implement TeacherAssignmentsModule:

```http
GET   /teacher-assignments?teacherId=&classId=&schoolYearId=&semesterId=&subjectId=&assignmentType=&isActive=
POST  /teacher-assignments
GET   /teacher-assignments/:id
PATCH /teacher-assignments/:id
GET   /teachers/:id/assignments
GET   /me/teacher-assignments
```

Quyen:

- `ACADEMIC_STAFF`: tao/cap nhat phan cong.
- `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`: xem phan cong.
- `TEACHER`: chi xem phan cong cua chinh minh.
- `STUDENT`: khong truy cap module phan cong.

### GET `/teacher-assignments`

Query:

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `teacherId` | number | Không | Lọc theo giáo viên |
| `classId` | number | Không | Lọc theo lớp |
| `schoolYearId` | number | Không | Lọc theo năm học |
| `semesterId` | number | Không | Lọc theo học kỳ |
| `subjectId` | number | Không | Lọc theo môn |
| `assignmentType` | string | Không | HOMEROOM/SUBJECT |
| `isActive` | boolean | Không | Lọc theo trạng thái |

### POST `/teacher-assignments`

Request GVCN:

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

Business rules:

- `assignmentType = HOMEROOM`.
- `subjectId` phải null.
- `semesterId` có thể null nếu áp dụng cả năm.
- `schoolYearId` bắt buộc.
- Một lớp chỉ có một GVCN active trong cùng năm học.

Request GVBM:

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

Business rules:

- `assignmentType = SUBJECT`.
- `schoolYearId`, `subjectId` và `semesterId` bắt buộc.
- Một lớp/môn/học kỳ chỉ có một GVBM active chính.

Error keys:

- `TEACHER_NOT_FOUND`
- `INVALID_HOMEROOM_ASSIGNMENT`
- `INVALID_SUBJECT_ASSIGNMENT`
- `HOMEROOM_ALREADY_ASSIGNED`
- `SUBJECT_TEACHER_ALREADY_ASSIGNED`

## 9. Score sheets

Da implement ScoresModule P0:

```http
GET  /scores/sheets?classId=&subjectId=&semesterId=&status=
POST /scores/sheets
GET  /scores/sheets/:id
PUT  /scores/sheets/:id/students/:studentId
POST /scores/sheets/:id/submit
POST /scores/sheets/:id/lock
POST /scores/sheets/:id/unlock
GET  /scores/my-scores
```

Quyen:

- `ACADEMIC_STAFF`, `MANAGER`: xem bang diem toan truong.
- `TEACHER` voi `HOMEROOM`: xem bang diem lop chu nhiem.
- `TEACHER` voi `SUBJECT`: xem va nhap diem dung lop/mon/hoc ky duoc phan cong.
- `STUDENT`: chi xem diem ca nhan qua `/scores/my-scores`.

Request `POST /scores/sheets`:

```json
{
  "classId": 1,
  "subjectId": 1,
  "semesterId": 1
}
```

Request `PUT /scores/sheets/:id/students/:studentId`:

```json
{
  "details": [
    { "testTypeCode": "ORAL_15M", "attemptNo": 1, "score": 8.0 },
    { "testTypeCode": "ONE_PERIOD", "attemptNo": 1, "score": 7.5 },
    { "testTypeCode": "MIDTERM", "attemptNo": 1, "score": 8.0 },
    { "testTypeCode": "FINAL", "attemptNo": 1, "score": 9.0 }
  ]
}
```

Cong thuc tinh diem theo AGENTS.md:

```text
avgOral = trung binh cac diem ORAL_15M
avgOnePeriod = trung binh cac diem ONE_PERIOD
subjectAverage = (avgOral * 1 + avgOnePeriod * 2 + midterm * 3 + final * 3) / 9
```

Submit:

- Chi GVBM cua bang diem submit.
- Toi thieu phai co `MIDTERM` va `FINAL` cho tat ca hoc sinh active trong lop.
- Sau submit, `status = SUBMITTED`.

Lock:

- Chi `ACADEMIC_STAFF` duoc khoa bang diem.
- Chi khoa duoc bang diem `SUBMITTED`.
- Backend kiem tra lai diem bat buoc truoc khi khoa.
- Sau lock, `status = LOCKED`, GVBM khong sua truc tiep.
- `unlock` la P1/tinh huong dac biet; neu chua co report chinh thuc thi chuyen `LOCKED -> NEEDS_CORRECTION`.

Error keys:

- `SCORE_SHEET_NOT_FOUND`
- `SCORE_INVALID_RANGE`
- `NOT_SUBJECT_TEACHER`
- `SCORE_SHEET_LOCKED`
- `SCORE_SHEET_NOT_SUBMITTED`
- `SCORE_SHEET_ALREADY_LOCKED`
- `CANNOT_UNLOCK_REPORTED_SCORE_SHEET`
- `STUDENT_NOT_IN_CLASS`
- `SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES`

### GET `/score-sheets`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `classId` | number | Có |
| `subjectId` | number | Có |
| `semesterId` | number | Có |

### POST `/score-sheets`

Tạo hoặc lưu bảng điểm.

Request:

```json
{
  "classId": 1,
  "subjectId": 1,
  "semesterId": 1,
  "scores": [
    {
      "studentId": 1,
      "details": [
        { "testTypeCode": "ORAL_15M", "attemptNo": 1, "score": 8.0 },
        { "testTypeCode": "ONE_PERIOD", "attemptNo": 1, "score": 7.5 },
        { "testTypeCode": "MIDTERM", "attemptNo": 1, "score": 8.0 },
        { "testTypeCode": "FINAL", "attemptNo": 1, "score": 9.0 }
      ]
    }
  ]
}
```

Response 200:

```json
{
  "id": 1,
  "classId": 1,
  "subjectId": 1,
  "semesterId": 1,
  "status": "DRAFT",
  "studentScores": [
    {
      "studentId": 1,
      "averageScore": 8.39,
      "passStatus": true
    }
  ]
}
```

### PATCH `/score-sheets/:id`

Cập nhật bảng điểm.

### PATCH `/score-sheets/:id/submit`

Chuyển trạng thái bảng điểm sang SUBMITTED.

### PATCH `/score-sheets/:id/lock`

Khóa bảng điểm.

## 10. Score change requests

Da implement:

```http
GET  /score-change-requests?status=&scoreSheetId=
POST /score-change-requests
GET  /score-change-requests/:id
POST /score-change-requests/:id/approve
POST /score-change-requests/:id/reject
```

Quyen:

- `ACADEMIC_STAFF`: xem tat ca, approve/reject.
- `MANAGER`: xem tat ca de giam sat.
- `TEACHER`: chi xem request do minh gui, chi GVBM dung phan cong moi tao request.
- `STUDENT`: khong truy cap.

### GET `/score-change-requests`

Query:

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `status` | string | Không | PENDING/APPROVED/REJECTED |
| `scoreSheetId` | number | Không | Lọc theo bảng điểm |

### POST `/score-change-requests`

Request:

```json
{
  "scoreSheetId": 1,
  "studentId": 1,
  "scoreType": "MIDTERM",
  "attemptNo": 1,
  "oldValue": 7.5,
  "newValue": 8.0,
  "reason": "Nhập nhầm điểm"
}
```

Rules:

- Chi tao request khi `ScoreSheet.status = LOCKED`.
- GVBM phai duoc phan cong `SUBJECT` dung lop/mon/hoc ky cua bang diem.
- Khong cho tao request `PENDING` trung hoc sinh/bang diem/loai diem.
- `newValue` phai nam trong `SystemParameter.minScore/maxScore`.

### POST `/score-change-requests/:id/approve`

Request:

```json
{
  "reviewNote": "Đã kiểm tra minh chứng"
}
```

### POST `/score-change-requests/:id/reject`

Request:

```json
{
  "reviewNote": "Minh chứng chưa hợp lệ"
}
```

Error keys:

- `SCORE_CHANGE_REQUEST_NOT_FOUND`
- `SCORE_CHANGE_REQUEST_DUPLICATED`
- `SCORE_CHANGE_REQUEST_ALREADY_PROCESSED`
- `SCORE_INVALID_RANGE`
- `NOT_SUBJECT_TEACHER`
- `ONLY_ACADEMIC_STAFF_CAN_APPROVE`

## 11. Score lookup

### GET `/students/:id/scores`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `semesterId` | number | Không |

### GET `/classes/:id/scores`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `subjectId` | number | Có |
| `semesterId` | number | Có |

## 12. Reports

Da implement:

```http
GET /reports/class-semester?classId=&semesterId=&includeUnOfficial=
GET /reports/subject-summary?classId=&subjectId=&semesterId=&includeUnOfficial=
GET /reports/student-semester/:studentId?semesterId=&includeUnOfficial=
GET /reports/dashboard-summary?schoolYearId=&semesterId=&includeUnOfficial=
```

Quyen:

- `ACADEMIC_STAFF`, `MANAGER`: xem bao cao toan truong.
- `TEACHER` voi `HOMEROOM`: xem bao cao lop chu nhiem.
- `TEACHER` voi `SUBJECT`: xem bao cao mon/lop minh day.
- `STUDENT`: chi xem bao cao ca nhan.

Mac dinh bao cao chi dung bang diem `LOCKED` va `isOfficial = true`.
Neu can xem tam du lieu `DRAFT/SUBMITTED`, gui `includeUnOfficial=true`; response se co `isOfficial = false`.

### GET `/reports/class-semester`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `classId` | number | Có |
| `semesterId` | number | Có |
| `includeUnOfficial` | boolean | Không |

Response gom: si so, diem trung binh hoc ky cua lop, so PASS/FAIL, danh sach hoc sinh.

### GET `/reports/subject-summary`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `subjectId` | number | Có |
| `semesterId` | number | Có |
| `classId` | number | Không |
| `includeUnOfficial` | boolean | Không |

Response:

```json
{
  "subjectId": 1,
  "semesterId": 1,
  "details": [
    {
      "classId": 1,
      "className": "10A1",
      "studentCount": 40,
      "passCount": 35,
      "passRate": 87.5
    }
  ]
}
```

### GET `/reports/student-semester/:studentId`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `semesterId` | number | Có |
| `includeUnOfficial` | boolean | Không |

Response gom diem tung mon, `semesterAverage`, `PASS/FAIL`.

### GET `/reports/dashboard-summary`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `schoolYearId` | number | Không |
| `semesterId` | number | Không |
| `includeUnOfficial` | boolean | Không |

Error keys:

- `REPORT_DATA_NOT_READY`
- `SCORE_SHEET_NOT_LOCKED`
- `FORBIDDEN_REPORT_SCOPE`

## 13. Error format

```json
{
  "statusCode": 400,
  "message": "Điểm phải nằm trong khoảng 0 đến 10",
  "error": "Bad Request"
}
```

## 14. HTTP status convention

| Status | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa đăng nhập hoặc token sai |
| 403 | Không có quyền |
| 404 | Không tìm thấy dữ liệu |
| 409 | Trùng dữ liệu/ràng buộc |
| 500 | Lỗi hệ thống |
