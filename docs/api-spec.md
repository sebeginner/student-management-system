# API Spec - Student Management System MVP

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
  "access_token": "jwt-token",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
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
  "role": "ADMIN"
}
```

## 3. Users

### GET `/users`

Query:

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `role` | string | Không | ADMIN/TEACHER/STUDENT |
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

## 5. Master data

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

## 8. Score sheets

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

## 9. Score lookup

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

## 10. Reports

### GET `/reports/subject`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `subjectId` | number | Có |
| `semesterId` | number | Có |

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

### GET `/reports/semester`

Query:

| Tên | Kiểu | Bắt buộc |
|---|---|---|
| `semesterId` | number | Có |

## 11. Error format

```json
{
  "statusCode": 400,
  "message": "Điểm phải nằm trong khoảng 0 đến 10",
  "error": "Bad Request"
}
```

## 12. HTTP status convention

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
