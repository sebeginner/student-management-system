# AGENTS.md — Quy tắc làm việc cho AI Agent/Codex

> Dự án: **Student Management System / Phần mềm Quản lý học sinh**  
> Môn học: **SE104 — Nhập môn Công nghệ phần mềm**  
> Mục tiêu file này: hướng dẫn AI coding agent hiểu đúng phạm vi, nghiệp vụ, kiến trúc, UI, database, API và quy trình làm việc của toàn bộ dự án.

---

## 1. Vai trò của AI agent trong dự án

AI agent được dùng như một **trợ lý lập trình có kiểm soát**, không phải người tự quyết định lại toàn bộ hệ thống.

Khi thực hiện task, agent phải:

1. Đọc tài liệu liên quan trước khi sửa code.
2. Bám sát scope đồ án SE104 và file báo cáo `Nhom4QLHS`.
3. Không tự ý đổi nghiệp vụ cốt lõi nếu chưa có yêu cầu rõ ràng.
4. Ưu tiên hoàn thiện tính năng chạy được, dễ demo, dễ chấm điểm.
5. Luôn giữ backend, frontend, database và docs thống nhất với nhau.
6. Khi tạo/sửa API, phải cập nhật `docs/api-spec.md` nếu có thay đổi endpoint, request, response hoặc rule.
7. Khi sửa database schema, phải cập nhật Prisma schema, migration, seed và docs liên quan.
8. Không tạo over-engineering vượt quá nhu cầu đồ án sinh viên.

---

## 2. Bối cảnh dự án

Dự án là hệ thống quản lý học sinh cho trường phổ thông, hỗ trợ số hóa các quy trình chính:

- Quản lý học sinh.
- Quản lý lớp, khối lớp, năm học, học kỳ.
- Quản lý môn học.
- Nhập và tra cứu bảng điểm.
- Lập báo cáo tổng kết môn học và học kỳ.
- Thay đổi quy định/tham số hệ thống.
- Quản lý người dùng, nhóm người dùng và quyền truy cập.

Hệ thống có 3 nhóm người dùng chính:

1. **Admin / Quản lý**
   - Quản lý quy định, tham số, lớp, môn, học kỳ, năm học.
   - Xem báo cáo tổng kết.
   - Quản lý người dùng, nhóm quyền, quyền truy cập.
   - Phân công giáo viên.

2. **Giáo viên**
   - Xem/tra cứu danh sách lớp.
   - Thêm/cập nhật thông tin học sinh trong phạm vi được phân công.
   - Nhập bảng điểm môn học.
   - Tra cứu điểm.
   - Tra cứu học sinh.

3. **Học sinh**
   - Tra cứu điểm cá nhân.
   - Tra cứu lớp học/danh sách lớp của mình.
   - Xem thông tin cá nhân cơ bản.

---

## 3. Phạm vi ưu tiên hiện thực

Trong 2 tuần cuối, ưu tiên theo thứ tự sau:

### P0 — Bắt buộc để demo được

- Auth đăng nhập bằng tài khoản seed.
- Phân quyền cơ bản theo role: `ADMIN`, `TEACHER`, `STUDENT`.
- Dashboard riêng cho từng role.
- CRUD học sinh.
- CRUD năm học, học kỳ, khối lớp, lớp học, môn học.
- Gán học sinh vào lớp theo năm học/học kỳ.
- Nhập bảng điểm môn học.
- Tính điểm trung bình môn.
- Tra cứu điểm cho giáo viên và học sinh.
- Tra cứu lớp học.
- Báo cáo tổng kết môn.
- Báo cáo tổng kết học kỳ.
- Seed dữ liệu tối thiểu để demo.

### P1 — Nên có nếu còn thời gian

- Import người dùng/học sinh từ CSV hoặc Excel.
- Export báo cáo ra Excel/PDF.
- Phân công giáo viên chủ nhiệm/bộ môn.
- Soft delete người dùng.
- Trang quản lý nhóm người dùng và quyền truy cập chi tiết.
- UI thống kê bằng biểu đồ.

### P2 — Không ưu tiên trong phase hiện tại

- Chat, notification realtime.
- Phân quyền cực chi tiết theo từng action nhỏ.
- Audit log phức tạp.
- Multi-school/multi-tenant.
- Hệ thống phụ huynh riêng.
- Mobile app.
- AI recommendation.

---

## 4. Stack kỹ thuật chuẩn

### Backend

- Node.js + TypeScript.
- NestJS.
- Prisma ORM.
- PostgreSQL.
- JWT authentication.
- DTO validation bằng `class-validator` và `class-transformer`.
- Swagger/OpenAPI nếu đã cấu hình.
- Unit test ưu tiên cho service chứa business rule.

### Frontend

- React + Vite + TypeScript.
- React Router.
- TanStack Query cho server state.
- Zustand hoặc Context cho auth/local UI state nếu cần.
- Tailwind CSS.
- shadcn/ui nếu dự án đã có.
- Form validation rõ ràng, không để lỗi silent.

### Database

- PostgreSQL.
- Prisma schema là nguồn chính cho implementation.
- Migration phải rõ ràng, không sửa tay database mà quên migration.
- Seed phải tạo đủ dữ liệu demo.

### Tooling

- ESLint + Prettier.
- Git branch: `main`, `develop`, `feature/*`, `fix/*`.
- Không commit `.env`, `node_modules`, file build, file log.

---

## 5. Kiến trúc tổng thể

Dự án đi theo hướng **web application client-server**, tổ chức backend theo phong cách **modular monolith**.

Frontend gọi REST API từ backend. Backend xử lý business logic và truy cập database qua Prisma.

Luồng chuẩn:

```text
React UI
  -> API Client / TanStack Query
  -> NestJS Controller
  -> DTO Validation
  -> Service / Use-case
  -> Prisma Repository / Prisma Client
  -> PostgreSQL
```

Nguyên tắc quan trọng:

- Controller chỉ nhận request, gọi service và trả response.
- Business logic đặt trong service/use-case, không đặt ở controller hoặc frontend.
- Prisma query nên được gom trong service hoặc repository rõ ràng.
- Frontend chỉ validate trải nghiệm người dùng; backend vẫn phải validate lại toàn bộ rule.
- Mọi thao tác thay đổi nhiều bảng phải dùng transaction khi cần.

---

## 6. Cấu trúc thư mục khuyến nghị

```text
student-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── filters/
│   │   │   └── utils/
│   │   ├── prisma/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── students/
│   │   ├── academic-years/
│   │   ├── semesters/
│   │   ├── grade-levels/
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── enrollments/
│   │   ├── scores/
│   │   ├── reports/
│   │   ├── parameters/
│   │   └── teacher-assignments/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   ├── classes/
│   │   │   ├── scores/
│   │   │   └── reports/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── types/
│   └── package.json
│
├── docs/
│   ├── api-spec.md
│   ├── database.md
│   ├── business-rules.md
│   ├── ui-spec.md
│   ├── workflow.md
│   └── seed-data.md
│
├── AGENTS.md
└── README.md
```

Nếu repo hiện tại khác cấu trúc trên, agent không được tự ý di chuyển hàng loạt. Chỉ refactor khi task yêu cầu hoặc khi có lợi rõ ràng và ít rủi ro.

---

## 7. Module backend chính

### 7.1. `auth`

Chức năng:

- Đăng nhập.
- Lấy thông tin người dùng hiện tại.
- Kiểm tra JWT.
- Guard theo role.

Endpoint gợi ý:

```http
POST /auth/login
GET /auth/me
POST /auth/logout        # optional nếu dùng token stateless thì frontend tự xóa token
```

Không lưu password dạng plain text. Luôn hash bằng bcrypt/argon2.

### 7.2. `users`

Chức năng:

- Quản lý tài khoản.
- Gán role/group.
- Reset password.
- Khóa tài khoản thay vì xóa cứng nếu user đã có dữ liệu liên quan.

Role tối thiểu:

```ts
ADMIN
TEACHER
STUDENT
```

### 7.3. `students`

Chức năng:

- Tiếp nhận học sinh.
- Cập nhật thông tin học sinh.
- Tìm kiếm học sinh.
- Xem chi tiết học sinh.

Rule:

- Tuổi học sinh nằm trong `[minAge, maxAge]`, mặc định `15..20`.
- Email nếu có thì nên unique hoặc ít nhất validate format.
- Không xóa cứng học sinh nếu đã có điểm/lớp; ưu tiên `isActive = false`.

### 7.4. `academic-years`, `semesters`

Chức năng:

- Quản lý năm học.
- Quản lý học kỳ.
- Một năm học có nhiều học kỳ.

Seed tối thiểu:

- Năm học `2024-2025`.
- Học kỳ `I`, `II`.

### 7.5. `grade-levels`, `classes`

Chức năng:

- Quản lý khối lớp 10, 11, 12.
- Quản lý lớp học theo năm học.
- Tra cứu danh sách lớp.

Rule mặc định:

- Khối lớp: 10, 11, 12.
- Lớp mẫu:
  - Khối 10: 10A1, 10A2, 10A3, 10A4.
  - Khối 11: 11A1, 11A2, 11A3.
  - Khối 12: 12A1, 12A2.
- Sĩ số tối đa mặc định: 40.
- Không cho thêm học sinh vào lớp nếu vượt sĩ số tối đa.

### 7.6. `subjects`

Chức năng:

- Quản lý môn học.
- Bật/tắt môn học.
- Không xóa môn đã có điểm.

Seed mặc định:

- Toán.
- Lý.
- Hóa.
- Sinh.
- Sử.
- Địa.
- Văn.
- Đạo Đức.
- Thể Dục.

### 7.7. `enrollments`

Chức năng:

- Gán học sinh vào lớp theo năm học/học kỳ.
- Tra cứu lớp hiện tại của học sinh.
- Tra cứu danh sách thành viên lớp.

Rule:

- Một học sinh không nên thuộc nhiều lớp trong cùng một học kỳ/năm học.
- Khi đổi lớp, cần kiểm tra lớp mới còn chỗ.
- Không mất lịch sử lớp cũ nếu đã qua học kỳ/năm học.

### 7.8. `scores`

Chức năng:

- Nhập bảng điểm môn học.
- Cập nhật điểm.
- Tính điểm trung bình môn.
- Tra cứu điểm theo lớp/môn/học kỳ.
- Tra cứu điểm cá nhân học sinh.

Loại điểm tối thiểu:

- Miệng/15 phút: có thể có nhiều điểm, hệ số 1.
- 1 tiết: có thể có nhiều điểm, hệ số 2.
- Giữa kỳ: một điểm, hệ số 3.
- Cuối kỳ: một điểm, hệ số 3.

Công thức mặc định:

```text
avgOral = trung bình các điểm Miệng/15 phút
avgOnePeriod = trung bình các điểm 1 tiết
subjectAverage = (finalScore * 3 + midtermScore * 3 + avgOnePeriod * 2 + avgOral * 1) / 9
```

Rule:

- Điểm nằm trong `[minScore, maxScore]`, mặc định `0..10`.
- Không lưu điểm không phải số.
- Không cho nhập điểm cho học sinh không thuộc lớp tương ứng.
- Khi thiếu thành phần điểm, cần xử lý rõ:
  - Hoặc không cho lưu hoàn tất.
  - Hoặc lưu nháp và chưa tính điểm trung bình.
- Làm tròn điểm trung bình nhất quán, khuyến nghị 2 chữ số thập phân.

### 7.9. `reports`

Chức năng:

- Báo cáo tổng kết môn.
- Báo cáo tổng kết học kỳ.

Rule mặc định:

- Điểm đạt môn: `subjectAverage >= passSubjectScore`, mặc định 5.
- Điểm đạt học kỳ: `semesterAverage >= passSemesterScore`, mặc định 5.
- Tỉ lệ đạt = `số lượng đạt / sĩ số * 100`.

Không nhất thiết phải lưu bảng báo cáo nếu có thể tính động từ dữ liệu điểm. Nếu lưu báo cáo, cần đảm bảo có cách tái tạo/cập nhật khi điểm thay đổi.

### 7.10. `parameters`

Chức năng:

- Quản lý tham số theo năm học.
- Cho phép thay đổi tuổi tối thiểu/tối đa, điểm tối thiểu/tối đa, sĩ số tối đa, điểm đạt, trọng số điểm.

Tham số tối thiểu:

```ts
minAge = 15
maxAge = 20
minScore = 0
maxScore = 10
maxClassSize = 40
passSubjectScore = 5
passSemesterScore = 5
oralWeight = 1
onePeriodWeight = 2
midtermWeight = 3
finalWeight = 3
```

Rule:

- `minAge < maxAge`.
- `minScore < maxScore`.
- `passSubjectScore` nằm trong `[minScore, maxScore]`.
- `passSemesterScore` nằm trong `[minScore, maxScore]`.
- Trọng số phải là số dương.

### 7.11. `teacher-assignments`

Chức năng P1:

- Gán giáo viên chủ nhiệm cho lớp.
- Gán giáo viên bộ môn cho lớp/học kỳ/môn.

Rule:

- Một lớp chỉ có một giáo viên chủ nhiệm trong cùng năm học.
- Một giáo viên không nên chủ nhiệm nhiều lớp cùng năm học nếu quy định bật.
- Một môn/lớp/học kỳ chỉ có một giáo viên phụ trách chính.

---

## 8. Database model khuyến nghị

Tên model có thể dùng tiếng Anh để code dễ maintain, nhưng phải map được với tài liệu tiếng Việt.

### Mapping bảng báo cáo sang model code

| Tài liệu | Prisma model gợi ý | Ý nghĩa |
|---|---|---|
| HOCSINH | Student | Học sinh |
| KHOILOP | GradeLevel | Khối lớp |
| LOP | Class | Lớp học |
| HOCSINH_LOP | Enrollment | Học sinh thuộc lớp theo kỳ/năm |
| MONHOC | Subject | Môn học |
| HOCKY | Semester | Học kỳ |
| NAMHOC | AcademicYear | Năm học |
| BANGDIEMMON | SubjectScoreSheet | Bảng điểm môn |
| CT_BANGDIEMMON_HOCSINH | StudentSubjectScore | Điểm tổng hợp môn của học sinh |
| LOAIHINHKIEMTRA | AssessmentType | Loại hình kiểm tra |
| CT_BANGDIEMMON_LHKT | ScoreEntry | Điểm thành phần |
| BAOCAOTKMON | SubjectReport | Báo cáo môn |
| CT_BAOCAOTKMON | SubjectReportDetail | Chi tiết báo cáo môn |
| BAOCAOTKHK | SemesterReport | Báo cáo học kỳ |
| THAMSO | SystemParameter | Tham số hệ thống |
| QUYEN | Permission | Quyền |
| NHOMNGUOIDUNG | Role/UserGroup | Nhóm người dùng |
| NGUOIDUNG | User | Người dùng |

### Ràng buộc quan trọng

Agent phải ưu tiên các unique constraint sau:

- `User.username` unique.
- `User.email` unique nếu email bắt buộc.
- `Student.email` unique nếu dùng email cho học sinh.
- `Class.name + academicYearId` unique.
- `Subject.name` unique hoặc `Subject.code` unique.
- `Semester.name + academicYearId` unique.
- `Enrollment.studentId + semesterId + academicYearId` unique nếu mỗi học sinh chỉ có một lớp/kỳ.
- `SubjectScoreSheet.classId + subjectId + semesterId + academicYearId` unique.
- `StudentSubjectScore.scoreSheetId + studentId` unique.
- `ScoreEntry.studentSubjectScoreId + assessmentTypeId + attemptNo` unique.

---

## 9. API convention

### 9.1. Response format

Khuyến nghị response thống nhất:

```json
{
  "data": {},
  "message": "Success"
}
```

Khi phân trang:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Khi lỗi:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

### 9.2. Endpoint gợi ý

Auth:

```http
POST /auth/login
GET /auth/me
```

Users:

```http
GET /users
POST /users
GET /users/:id
PATCH /users/:id
PATCH /users/:id/reset-password
DELETE /users/:id
```

Students:

```http
GET /students
POST /students
GET /students/:id
PATCH /students/:id
DELETE /students/:id
```

Academic setup:

```http
GET /academic-years
POST /academic-years
PATCH /academic-years/:id
DELETE /academic-years/:id

GET /semesters
POST /semesters
PATCH /semesters/:id
DELETE /semesters/:id

GET /grade-levels
POST /grade-levels
PATCH /grade-levels/:id
DELETE /grade-levels/:id

GET /classes
POST /classes
GET /classes/:id
PATCH /classes/:id
DELETE /classes/:id
GET /classes/:id/students

GET /subjects
POST /subjects
PATCH /subjects/:id
DELETE /subjects/:id
```

Enrollments:

```http
POST /enrollments
GET /enrollments
DELETE /enrollments/:id
```

Scores:

```http
GET /scores/sheets
POST /scores/sheets
GET /scores/sheets/:id
PUT /scores/sheets/:id/students/:studentId
GET /scores/class-scoreboard
GET /scores/my-scores
```

Reports:

```http
GET /reports/subject-summary
GET /reports/semester-summary
GET /reports/subject-summary/export
GET /reports/semester-summary/export
```

Parameters:

```http
GET /parameters
GET /parameters/current
POST /parameters
PATCH /parameters/:id
```

Teacher assignments:

```http
GET /teacher-assignments
POST /teacher-assignments/homeroom
POST /teacher-assignments/subject
DELETE /teacher-assignments/:id
```

---

## 10. UI/UX định hướng theo báo cáo

Giao diện cần giữ phong cách:

- Sạch, sáng, dễ dùng.
- Sidebar trái cho dashboard theo role.
- Card chức năng nhanh ở trang chủ.
- Table/DataGrid cho danh sách.
- Form modal/popup cho thêm/sửa nhanh.
- Badge màu để thể hiện trạng thái, role, xếp loại.
- Các màn hình báo cáo có card thống kê và biểu đồ nếu có thời gian.

### 10.1. Màn hình chung

- Đăng nhập.
- Đăng ký nếu hệ thống cho phép tự đăng ký.
- Chỉnh sửa tài khoản.
- Đăng xuất.

### 10.2. Màn hình giáo viên

- Dashboard giáo viên.
- Danh sách lớp.
- Nhập bảng điểm.
- Tra cứu điểm.
- Tra cứu học sinh.

### 10.3. Màn hình học sinh

- Dashboard học sinh.
- Tra cứu điểm cá nhân.
- Tra cứu lớp học.

### 10.4. Màn hình quản lý/admin

- Dashboard quản lý.
- Thay đổi quy định: học kỳ, môn học, khối lớp.
- Thay đổi tham số.
- Báo cáo học kỳ.
- Báo cáo môn học.
- Quản lý phân công giáo viên.
- Quản lý người dùng.
- Quản lý nhóm người dùng.
- Quản lý quyền truy cập.

### 10.5. Quy tắc frontend bắt buộc

- Không hardcode dữ liệu chính nếu backend đã có API.
- Cho phép loading, empty state và error state.
- Form phải validate trước khi gọi API.
- Backend error phải hiển thị rõ cho người dùng.
- Không để màn hình trắng khi API lỗi.
- Không hiển thị menu mà role hiện tại không có quyền dùng.
- Sau khi thêm/sửa/xóa, phải invalidate/refetch query liên quan.

---

## 11. Business rules bắt buộc

### 11.1. Tiếp nhận học sinh

- Họ tên và ngày sinh bắt buộc.
- Tuổi nằm trong `[minAge, maxAge]`.
- Email đúng định dạng nếu có nhập.
- Không tạo học sinh trùng lặp quá rõ ràng nếu có cùng họ tên + ngày sinh + email.

### 11.2. Lớp học

- Lớp thuộc một khối lớp và một năm học.
- Sĩ số không vượt `maxClassSize`.
- Không xóa lớp nếu đã có học sinh/điểm/phân công.

### 11.3. Môn học

- Tên/mã môn học không trùng.
- Không xóa môn nếu đã có điểm.

### 11.4. Học kỳ và năm học

- Học kỳ thuộc một năm học.
- Không xóa học kỳ nếu đã có điểm/báo cáo/enrollment.

### 11.5. Nhập điểm

- Điểm phải là số trong `[0, 10]` hoặc theo tham số hiện hành.
- Điểm Miệng/15 phút và 1 tiết có thể là danh sách nhiều điểm.
- Giữa kỳ và cuối kỳ chỉ một điểm.
- Điểm trung bình môn tính theo trọng số cấu hình.
- Không nhập điểm cho học sinh không thuộc lớp trong kỳ đó.

### 11.6. Báo cáo

- Báo cáo môn: thống kê theo môn, học kỳ, năm học, từng lớp.
- Báo cáo học kỳ: thống kê theo học kỳ, năm học, từng lớp.
- Tỷ lệ đạt phải tính dựa trên sĩ số thực tế.
- Không chia cho 0; nếu lớp chưa có học sinh thì tỷ lệ đạt = 0 hoặc null, nhưng phải hiển thị rõ.

### 11.7. Phân quyền

- Admin có toàn quyền.
- Teacher chỉ dùng chức năng giảng dạy/tra cứu được phép.
- Student chỉ xem dữ liệu của chính mình.
- Backend phải enforce role, không chỉ ẩn UI.

---

## 12. Seed data tối thiểu

Agent phải giữ seed đủ để demo ngay sau khi migrate.

### 12.1. Tài khoản demo

```text
Admin:
  username: admin
  password: Admin@123
  role: ADMIN

Teacher:
  username: teacher01
  password: Teacher@123
  role: TEACHER

Student:
  username: student01
  password: Student@123
  role: STUDENT
```

### 12.2. Dữ liệu học vụ

- Năm học: `2024-2025`.
- Học kỳ: `I`, `II`.
- Khối lớp: `10`, `11`, `12`.
- Lớp: `10A1`, `10A2`, `10A3`, `10A4`, `11A1`, `11A2`, `11A3`, `12A1`, `12A2`.
- Môn học: Toán, Lý, Hóa, Sinh, Sử, Địa, Văn, Đạo Đức, Thể Dục.
- Tham số: minAge 15, maxAge 20, maxClassSize 40, minScore 0, maxScore 10, pass scores 5.
- Một số học sinh mẫu thuộc lớp 10A1.
- Một bảng điểm mẫu môn Toán học kỳ I.

---

## 13. Quy trình làm việc với Git

### 13.1. Branch

- `main`: bản ổn định để nộp/demo.
- `develop`: bản tích hợp chung.
- `feature/backend-auth`: tính năng backend auth.
- `feature/frontend-login`: tính năng frontend login.
- `fix/prisma-seed`: sửa lỗi seed/migration.

### 13.2. Quy trình task

1. Pull code mới nhất từ `develop`.
2. Tạo branch theo task.
3. Đọc docs liên quan.
4. Implement nhỏ, test từng bước.
5. Chạy lint/test/build nếu có.
6. Cập nhật docs nếu API/database/business rule đổi.
7. Commit message rõ ràng.
8. Mở PR hoặc merge về `develop` sau khi kiểm tra.

### 13.3. Commit message

Dùng format:

```text
feat(auth): implement login api
fix(scores): correct subject average formula
docs(api): update score endpoints
chore(seed): add demo students and classes
refactor(users): simplify role guard
```

---

## 14. Quy trình làm việc cho AI agent/Codex

Mỗi task agent phải làm theo checklist:

### Bước 1 — Hiểu task

- Xác định task thuộc backend, frontend, database hay docs.
- Tìm file liên quan.
- Kiểm tra docs trước khi sửa.
- Nếu có mâu thuẫn giữa code và docs, ưu tiên hỏi lại hoặc ghi chú rõ trong kết quả.

### Bước 2 — Lập kế hoạch nhỏ

Không sửa lan man. Chỉ chạm vào file cần thiết.

Ví dụ task: “Làm API nhập điểm” thì chỉ nên sửa:

- `scores` module.
- DTO liên quan.
- Prisma nếu thiếu model.
- `docs/api-spec.md`.
- Test hoặc seed nếu cần.

### Bước 3 — Implement

- Viết code rõ ràng, type-safe.
- Không dùng `any` nếu không cần.
- Không copy-paste logic lặp quá nhiều.
- Business rule phải nằm ở service.
- Dùng transaction khi tạo/cập nhật nhiều record liên quan.

### Bước 4 — Kiểm tra

Agent phải tự kiểm tra tối thiểu:

- TypeScript compile nếu có thể.
- Lint nếu có script.
- Test nếu có script.
- Prisma generate/migrate nếu đụng schema.
- Frontend build nếu đụng UI lớn.

### Bước 5 — Báo cáo kết quả

Khi hoàn thành, agent phải nêu:

- Đã sửa file nào.
- Đã thêm/chỉnh chức năng gì.
- Cách test/chạy.
- Còn rủi ro/gợi ý tiếp theo nào.

---

## 15. Coding standards backend

### 15.1. Controller

Controller chỉ nên:

- Nhận params/query/body.
- Gọi service.
- Trả kết quả.

Không viết logic tính điểm, rule tuổi, rule sĩ số trong controller.

### 15.2. DTO

DTO phải validate:

- Required field.
- Type.
- String length nếu cần.
- Enum nếu có.
- Number range cơ bản.

Ví dụ:

```ts
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

### 15.3. Service

Service chịu trách nhiệm:

- Kiểm tra business rule.
- Kiểm tra quyền nghiệp vụ nếu guard chưa đủ.
- Gọi Prisma.
- Transaction.
- Throw exception rõ ràng.

### 15.4. Exception

Dùng exception chuẩn NestJS:

- `BadRequestException` cho dữ liệu sai/rule sai.
- `UnauthorizedException` cho chưa đăng nhập.
- `ForbiddenException` cho không có quyền.
- `NotFoundException` cho không tìm thấy.
- `ConflictException` cho trùng dữ liệu.

---

## 16. Coding standards frontend

### 16.1. Component

- Component nhỏ, dễ đọc.
- Page component không nên chứa quá nhiều logic phức tạp.
- API call tách ra `services` hoặc `api` layer.
- Type response rõ ràng.

### 16.2. Form

- Hiển thị lỗi dưới field.
- Disable submit khi loading.
- Không submit nhiều lần liên tục.
- Sau submit thành công: toast + refetch/navigate.

### 16.3. Table

- Có loading state.
- Có empty state.
- Có error state.
- Có confirm modal khi xóa.
- Không xóa cứng nếu backend báo không cho phép.

### 16.4. Auth UI

- Token lưu nhất quán.
- Khi token hết hạn hoặc API trả 401, chuyển về login.
- Menu theo role.
- Route protection theo role.

---

## 17. Tài liệu phải giữ thống nhất

Khi code thay đổi, cập nhật docs tương ứng:

| Khi thay đổi | File cần cập nhật |
|---|---|
| API endpoint | `docs/api-spec.md` |
| Database schema | `docs/database.md`, `backend/prisma/schema.prisma` |
| Business rule | `docs/business-rules.md` |
| Giao diện/màn hình | `docs/ui-spec.md` |
| Seed data | `docs/seed-data.md`, `backend/prisma/seed.ts` |
| Quy trình làm việc | `docs/workflow.md` hoặc `AGENTS.md` |

Không để tình trạng API trong code khác với `api-spec.md`.

---

## 18. Tiêu chuẩn hoàn thành tính năng

Một tính năng chỉ được xem là hoàn thành khi:

1. Backend endpoint chạy được.
2. Validate dữ liệu đúng.
3. Business rule được enforce ở backend.
4. Frontend gọi được API thật.
5. UI có loading/error/success state.
6. Seed/test data đủ để demo.
7. Docs liên quan được cập nhật.
8. Không phá chức năng đã có.

---

## 19. Checklist demo cuối kỳ

Trước khi demo, phải đảm bảo chạy được flow sau:

### Flow Admin

1. Đăng nhập bằng `admin / Admin@123`.
2. Vào dashboard quản lý.
3. Xem danh sách năm học/học kỳ/lớp/môn.
4. Chỉnh tham số: sĩ số tối đa, điểm đạt, tuổi.
5. Xem báo cáo học kỳ.
6. Xem báo cáo môn học.
7. Quản lý người dùng hoặc xem danh sách user.

### Flow Teacher

1. Đăng nhập bằng `teacher01 / Teacher@123`.
2. Vào dashboard giáo viên.
3. Xem danh sách lớp.
4. Chọn lớp 10A1.
5. Nhập/cập nhật điểm môn Toán học kỳ I.
6. Xem điểm vừa nhập trong màn hình tra cứu điểm.
7. Tra cứu học sinh.

### Flow Student

1. Đăng nhập bằng `student01 / Student@123`.
2. Vào dashboard học sinh.
3. Xem điểm cá nhân.
4. Xem danh sách lớp của mình.

---

## 20. Những điều agent không được làm

- Không đổi project sang framework khác.
- Không xóa dữ liệu seed quan trọng.
- Không thay đổi công thức điểm nếu không có yêu cầu.
- Không hardcode role ở frontend mà backend không kiểm tra.
- Không bỏ qua migration khi sửa schema.
- Không commit `.env` thật.
- Không lưu password plain text.
- Không tạo tính năng quá lớn làm trễ P0.
- Không refactor toàn repo khi task chỉ yêu cầu sửa một lỗi nhỏ.
- Không sửa docs cho đẹp nhưng code không chạy.

---

## 21. Prompt mẫu để giao việc cho Codex/AI agent

Dùng mẫu sau khi tạo task:

```text
Bạn đang làm trong dự án Student Management System SE104.
Trước khi code, hãy đọc AGENTS.md và các file docs liên quan.

Task: [mô tả task cụ thể]

Yêu cầu:
- Không đổi scope ngoài task.
- Bám theo business rules trong AGENTS.md.
- Nếu sửa API, cập nhật docs/api-spec.md.
- Nếu sửa database, cập nhật Prisma schema, migration/seed nếu cần.
- Sau khi sửa, nêu rõ file đã chỉnh và cách test.
```

Ví dụ:

```text
Task: Implement API nhập bảng điểm môn học.

Yêu cầu nghiệp vụ:
- Teacher chọn classId, subjectId, semesterId, academicYearId.
- Backend kiểm tra học sinh thuộc lớp.
- Điểm nằm trong 0..10 theo tham số hiện hành.
- Tính subjectAverage theo công thức trọng số 1-2-3-3.
- Lưu điểm thành phần và điểm trung bình.
- Cập nhật docs/api-spec.md.
```

---

## 22. Ghi chú cho nhóm sinh viên

Dự án nên ưu tiên **đúng nghiệp vụ, chạy ổn, demo rõ ràng** hơn là cố làm quá nhiều tính năng.

Nếu còn ít thời gian, tập trung hoàn thiện:

1. Auth + role.
2. Database + seed ổn định.
3. CRUD dữ liệu học vụ.
4. Nhập điểm + tính điểm đúng.
5. Tra cứu điểm/lớp/học sinh.
6. Báo cáo tổng kết.
7. UI đủ giống báo cáo và dễ thuyết trình.

Một tính năng nhỏ nhưng chạy chắc chắn sẽ có giá trị hơn một tính năng lớn nhưng lỗi nhiều.
