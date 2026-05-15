# AGENTS.md — Quy tắc làm việc cho AI Agent/Codex

> Dự án: **Student Management System / Phần mềm Quản lý học sinh cấp 3**  
> Môn học: **SE104 — Nhập môn Công nghệ phần mềm**  
> Branch làm việc chính: **develop**  
> Mục tiêu file này: hướng dẫn AI coding agent hiểu đúng phạm vi, nghiệp vụ, phân quyền, kiến trúc, database, API, UI và quy trình làm việc của toàn bộ dự án.

---

## 0. Nguyên tắc bắt buộc

AI agent được dùng như một **trợ lý lập trình có kiểm soát**, không phải người tự quyết định lại toàn bộ hệ thống.

Khi thực hiện task, agent phải:

1. Đọc `AGENTS.md` trước khi sửa code.
2. Đọc thêm docs liên quan nếu task đụng tới API, database, business rule hoặc UI.
3. Bám sát scope đồ án SE104: **quản lý học sinh cấp 3**, không mở rộng thành LMS/đại học/hệ thống học phí.
4. Không tự ý đổi nghiệp vụ cốt lõi nếu chưa có yêu cầu rõ ràng.
5. Ưu tiên tính năng chạy được, dễ demo, dễ chấm điểm.
6. Luôn giữ backend, frontend, database và docs thống nhất.
7. Nếu tạo/sửa API, phải cập nhật `docs/api-spec.md`.
8. Nếu sửa Prisma schema, phải cập nhật migration, seed và docs liên quan.
9. Không over-engineering vượt nhu cầu đồ án sinh viên.
10. Backend phải enforce phân quyền; frontend chỉ ẩn menu là chưa đủ.

---

## 1. Bối cảnh nghiệp vụ đã chốt

Dự án là hệ thống quản lý học sinh cấp 3, phục vụ các quy trình chính:

- Đăng nhập, tài khoản, phân quyền.
- Quản lý học sinh.
- Quản lý năm học, học kỳ, khối 10/11/12, lớp học.
- Quản lý môn học.
- Quản lý giáo viên.
- Phân công giáo viên chủ nhiệm và giáo viên bộ môn.
- Tiếp nhận học sinh.
- Phân lớp đầu năm.
- Chuyển lớp.
- Nhập điểm.
- Khóa bảng điểm.
- Gửi yêu cầu sửa điểm sau khi bảng điểm đã khóa.
- Duyệt/từ chối yêu cầu sửa điểm.
- Tra cứu điểm.
- Tổng kết học kỳ.
- Tổng kết năm học/xét lên lớp ở mức đơn giản.
- Báo cáo học vụ.
- Thay đổi tham số/quy định hệ thống.
- Import/export nếu còn thời gian.

Ngoài phạm vi hiện tại:

- Đăng ký học phần/tín chỉ/khoa/hệ đào tạo.
- LMS đầy đủ: tài liệu học tập, bài tập online, chat lớp, bình luận.
- Học phí/thanh toán.
- Phụ huynh portal.
- Multi-school/multi-tenant.
- Mobile app.
- AI recommendation.

---

## 2. Actor và phân quyền đã chốt

### 2.1. Role hệ thống

Hệ thống dùng các role chính sau:

```ts
ADMIN
ACADEMIC_STAFF // Giáo vụ
MANAGER        // Ban giám hiệu / Quản lý
TEACHER
STUDENT
```

Có thể dùng tên tiếng Việt trong UI, nhưng trong code nên dùng enum tiếng Anh để dễ maintain.

Mapping hiển thị:

| Code role | Tên hiển thị | Ý nghĩa |
|---|---|---|
| `ADMIN` | Quản trị viên | Quản trị tài khoản, role, permission, cấu hình kỹ thuật |
| `ACADEMIC_STAFF` | Giáo vụ | Quản lý nghiệp vụ học vụ: học sinh, lớp, phân lớp, chuyển lớp, điểm, báo cáo |
| `MANAGER` | Ban giám hiệu / Quản lý | Xem báo cáo toàn trường, giám sát và duyệt thao tác quan trọng nếu cần |
| `TEACHER` | Giáo viên | Có quyền tùy theo phân công GVCN/GVBM |
| `STUDENT` | Học sinh | Chỉ xem dữ liệu cá nhân và lớp của mình |

### 2.2. Nguyên tắc quan trọng về GVCN và GVBM

Không tạo hai tài khoản riêng cho GVCN và GVBM.

Không nên tạo role hệ thống riêng là `HOMEROOM_TEACHER` và `SUBJECT_TEACHER` nếu không thật sự cần.

GVCN và GVBM là **vai trò theo phân công**, không phải role đăng nhập cố định.

Cách model đúng:

```ts
User.role = TEACHER

TeacherAssignment.assignmentType =
  | HOMEROOM // Giáo viên chủ nhiệm
  | SUBJECT  // Giáo viên bộ môn
```

Một giáo viên có thể vừa là GVCN vừa là GVBM.

Ví dụ:

```text
teacher01:
- HOMEROOM lớp 10A1 năm học 2024-2025
- SUBJECT môn Toán lớp 10A1 học kỳ I
- SUBJECT môn Toán lớp 10A2 học kỳ I
```

Khi kiểm tra quyền, hệ thống cộng quyền theo các assignment active, nhưng không cho vượt phạm vi của từng assignment.

### 2.3. Quyền GVCN

GVCN được:

- Xem danh sách học sinh lớp chủ nhiệm.
- Xem hồ sơ học sinh lớp chủ nhiệm.
- Xem điểm và tổng kết của học sinh lớp chủ nhiệm.
- Xem lịch sử chuyển lớp có liên quan đến lớp chủ nhiệm.
- Gửi thông báo cho lớp chủ nhiệm nếu module thông báo được làm.
- Xem báo cáo lớp chủ nhiệm.

GVCN không được:

- Nhập/sửa điểm nếu không đồng thời là GVBM của môn đó.
- Khóa/mở khóa bảng điểm.
- Duyệt yêu cầu sửa điểm.
- Phân lớp/chuyển lớp.
- Quản lý tài khoản/quyền.

### 2.4. Quyền GVBM

GVBM được:

- Xem danh sách học sinh của lớp mình dạy.
- Nhập điểm đúng môn/lớp/học kỳ được phân công.
- Sửa điểm khi bảng điểm chưa khóa.
- Gửi yêu cầu sửa điểm khi bảng điểm đã khóa.
- Xem trạng thái bảng điểm môn mình.
- Xem tổng kết môn mình dạy.

GVBM không được:

- Xem/sửa điểm môn khác nếu không được phân công.
- Xem toàn bộ điểm các môn của lớp nếu không đồng thời là GVCN.
- Khóa bảng điểm.
- Duyệt yêu cầu sửa điểm.
- Phân lớp/chuyển lớp.

### 2.5. Quyền Giáo vụ

Giáo vụ là actor trung tâm của nghiệp vụ học vụ.

Giáo vụ được:

- Quản lý học sinh.
- Quản lý lớp, khối, năm học, học kỳ.
- Quản lý môn học.
- Quản lý giáo viên.
- Phân lớp đầu năm.
- Chuyển lớp.
- Phân công GVCN/GVBM.
- Mở/khóa bảng điểm.
- Duyệt/từ chối yêu cầu sửa điểm.
- Tổng kết học kỳ/năm học.
- Tạo báo cáo.
- Import/export học vụ nếu có.

Giáo vụ không phải Admin kỹ thuật. Không nên kéo mọi quyền quản trị hệ thống vào Giáo vụ nếu không cần.

### 2.6. Quyền Admin

Admin tập trung vào:

- Tài khoản.
- Role/permission.
- Cấu hình hệ thống.
- Nhật ký hệ thống.
- Seed/demo data nếu cần.

Admin không nên là actor chính xử lý nghiệp vụ học vụ hằng ngày.

### 2.7. Quyền BGH/Manager

BGH/Manager chủ yếu:

- Xem dashboard/báo cáo toàn trường.
- Xem dữ liệu tổng hợp.
- Duyệt một số thao tác quan trọng nếu hệ thống có workflow duyệt.
- Không nhập điểm, không xử lý nghiệp vụ chi tiết thay Giáo vụ.

---

## 3. Phạm vi ưu tiên hiện thực

### P0 — Bắt buộc để demo đúng đặc tả

- Auth đăng nhập bằng tài khoản seed.
- Role guard: `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`, `STUDENT`.
- Dashboard/menu theo role.
- CRUD học sinh.
- CRUD năm học, học kỳ, khối lớp, lớp học, môn học.
- Quản lý giáo viên.
- Phân công GVCN/GVBM bằng `TeacherAssignment`.
- Phân lớp học sinh vào lớp.
- Chuyển lớp học sinh ở mức cơ bản.
- Nhập điểm theo phân công GVBM.
- Tính điểm trung bình môn.
- Khóa bảng điểm.
- Gửi yêu cầu sửa điểm khi bảng điểm đã khóa.
- Giáo vụ duyệt/từ chối yêu cầu sửa điểm.
- Học sinh tra cứu điểm cá nhân.
- GVCN xem điểm lớp chủ nhiệm.
- GVBM xem/nhập điểm môn được phân công.
- Báo cáo tổng kết môn.
- Báo cáo tổng kết học kỳ.
- Seed dữ liệu đủ để demo ngay.

### P1 — Nên có nếu còn thời gian

- Tổng kết năm học/xét lên lớp/tốt nghiệp mức đơn giản.
- Import học sinh/giáo viên/lớp/điểm từ Excel/CSV.
- Export báo cáo ra Excel/PDF.
- Thông báo học vụ.
- Audit log nghiệp vụ điểm/phân lớp/chuyển lớp.
- UI thống kê bằng biểu đồ.
- Trang quản lý nhóm quyền chi tiết.

### P2 — Không ưu tiên trong phase hiện tại

- Chat, notification realtime.
- LMS/bài tập/tài liệu học tập.
- Phụ huynh portal.
- Mobile app.
- Multi-school/multi-tenant.
- AI recommendation.
- Microservices.

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
- Migration phải rõ ràng.
- Không sửa tay database rồi quên migration.
- Seed phải tạo đủ dữ liệu demo.

### Tooling

- ESLint + Prettier nếu repo đã cấu hình.
- Git branch: `main`, `develop`, `feature/*`, `fix/*`.
- Không commit `.env`, `node_modules`, file build, file log.

---

## 5. Kiến trúc tổng thể

Dự án đi theo hướng **web application client-server**, backend tổ chức theo **modular monolith**.

Luồng chuẩn:

```text
React UI
-> API Client / TanStack Query
-> NestJS Controller
-> DTO Validation
-> Service / Use-case
-> Prisma Client
-> PostgreSQL
```

Nguyên tắc:

- Controller chỉ nhận request, gọi service và trả response.
- Business logic đặt trong service/use-case.
- Không đặt rule tuổi, sĩ số, điểm, phân quyền nghiệp vụ trong frontend.
- Frontend validate để tăng UX, backend vẫn phải validate lại.
- Mọi thao tác thay đổi nhiều bảng phải dùng transaction.
- Không refactor toàn repo nếu task chỉ yêu cầu sửa một phần nhỏ.

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
│   │   │   ├── filters/
│   │   │   └── utils/
│   │   ├── prisma/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── academic-years/
│   │   ├── semesters/
│   │   ├── grade-levels/
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── enrollments/
│   │   ├── teacher-assignments/
│   │   ├── scores/
│   │   ├── score-change-requests/
│   │   ├── reports/
│   │   ├── parameters/
│   │   └── audit-logs/
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
│   │   │   ├── academic-staff/
│   │   │   ├── manager/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   ├── classes/
│   │   │   ├── enrollments/
│   │   │   ├── scores/
│   │   │   └── reports/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── types/
│   └── package.json
│
├── docs/
│   ├── api-spec.md
│   ├── authorization.md
│   ├── database.md
│   ├── business-rules.md
│   ├── ui-spec.md
│   ├── workflow.md
│   └── seed-data.md
│
├── AGENTS.md
└── README.md
```

Nếu repo hiện tại khác cấu trúc trên, agent không được tự ý di chuyển hàng loạt. Chỉ refactor khi task yêu cầu hoặc có lợi rõ ràng và ít rủi ro.

---

## 7. Module backend chính

### 7.1. `auth`

Chức năng:

- Đăng nhập.
- Lấy thông tin người dùng hiện tại.
- Kiểm tra JWT.
- Guard theo role.
- Trả thông tin role và scope cơ bản của user.

Endpoint gợi ý:

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

Không lưu password plain text. Luôn hash bằng bcrypt/argon2.

### 7.2. `users`

Chức năng:

- Quản lý tài khoản.
- Gán role.
- Khóa/mở tài khoản.
- Reset password.

Role chính:

```ts
ADMIN
ACADEMIC_STAFF
MANAGER
TEACHER
STUDENT
```

Rule:

- Không xóa cứng user đã phát sinh dữ liệu.
- Ưu tiên `status = ACTIVE | LOCKED | DISABLED`.
- Tạo user giáo viên/học sinh nên liên kết với `Teacher` hoặc `Student`.

### 7.3. `students`

Chức năng:

- Tiếp nhận học sinh.
- Cập nhật hồ sơ học sinh.
- Tìm kiếm học sinh.
- Xem chi tiết học sinh.
- Chuyển trạng thái học sinh.

Rule:

- Tuổi học sinh nằm trong `[minAge, maxAge]`, mặc định `15..20`.
- Email nếu có phải đúng định dạng.
- Không tạo học sinh trùng rõ ràng theo mã học sinh/email hoặc họ tên + ngày sinh.
- Học sinh mới nên có trạng thái `PENDING_CLASS_ASSIGNMENT`.
- Không xóa cứng học sinh đã có lớp/điểm.

Trạng thái gợi ý:

```ts
PENDING_CLASS_ASSIGNMENT
ACTIVE
SUSPENDED
TRANSFERRED
GRADUATED
INACTIVE
```

### 7.4. `teachers`

Chức năng:

- Quản lý hồ sơ giáo viên.
- Liên kết giáo viên với tài khoản user.
- Tra cứu giáo viên theo chuyên môn/tổ bộ môn nếu có.

Rule:

- Không xóa cứng giáo viên đã có phân công.
- Giáo viên có thể có nhiều assignment.

### 7.5. `academic-years`, `semesters`

Chức năng:

- Quản lý năm học.
- Quản lý học kỳ.
- Đóng/mở học kỳ ở mức đơn giản nếu cần.

Seed tối thiểu:

- Năm học `2024-2025`.
- Học kỳ `I`, `II`.

### 7.6. `grade-levels`, `classes`

Chức năng:

- Quản lý khối lớp 10, 11, 12.
- Quản lý lớp học theo năm học.
- Tra cứu danh sách lớp.
- Tra cứu học sinh trong lớp.

Rule:

- Chỉ quản lý khối 10, 11, 12.
- Lớp thuộc một khối và một năm học.
- Sĩ số không vượt `maxClassSize`.
- Không xóa lớp nếu đã có học sinh/điểm/phân công.

### 7.7. `subjects`

Chức năng:

- Quản lý môn học.
- Bật/tắt môn học.

Seed gợi ý:

- Toán.
- Văn.
- Anh.
- Lý.
- Hóa.
- Sinh.
- Sử.
- Địa.
- Tin.
- GDCD.
- Thể dục.

Rule:

- Tên/mã môn không trùng.
- Không xóa môn đã có điểm/phân công.

### 7.8. `enrollments`

Chức năng:

- Phân học sinh vào lớp.
- Chuyển lớp.
- Tra cứu lớp hiện tại của học sinh.
- Tra cứu lịch sử lớp của học sinh.

Rule:

- Một học sinh chỉ có một lớp active trong cùng học kỳ/năm học.
- Không phân vào lớp đã đủ sĩ số.
- Chuyển lớp phải giữ lịch sử lớp cũ.
- Chuyển lớp phải dùng transaction.
- Điểm đã nhập không bị mất khi chuyển lớp.
- Nếu chưa có bảng lịch sử riêng, có thể dùng `StudentClassEnrollment.status` và `endedAt`.

Endpoint gợi ý:

```http
POST /api/v1/enrollments/assign
POST /api/v1/enrollments/transfer
GET  /api/v1/enrollments
GET  /api/v1/students/:id/enrollments
GET  /api/v1/classes/:id/students
```

### 7.9. `teacher-assignments`

Chức năng:

- Gán GVCN cho lớp theo năm học.
- Gán GVBM cho lớp/môn/học kỳ.
- Tra cứu phân công của giáo viên.
- Tra cứu phân công của lớp.

Model nghiệp vụ gợi ý:

```ts
TeacherAssignmentType = HOMEROOM | SUBJECT
```

Rule:

- `HOMEROOM`: `subjectId = null`, `semesterId` có thể null nếu áp dụng cả năm.
- `SUBJECT`: `subjectId` bắt buộc, `semesterId` bắt buộc.
- Một lớp chỉ có một GVCN active trong cùng năm học.
- Một giáo viên không nên chủ nhiệm quá một lớp trong cùng năm học.
- Một môn/lớp/học kỳ nên có một GVBM chính.
- Không tạo phân công trùng active.

Endpoint gợi ý:

```http
GET    /api/v1/teacher-assignments
POST   /api/v1/teacher-assignments/homeroom
POST   /api/v1/teacher-assignments/subject
DELETE /api/v1/teacher-assignments/:id
```

### 7.10. `scores`

Chức năng:

- Tạo bảng điểm môn học.
- Nhập/cập nhật điểm thành phần.
- Tính điểm trung bình môn.
- Tra cứu điểm theo lớp/môn/học kỳ.
- Tra cứu điểm cá nhân học sinh.
- Khóa bảng điểm.

Loại điểm tối thiểu:

- Miệng/15 phút: có thể có nhiều điểm, hệ số 1.
- 1 tiết: có thể có nhiều điểm, hệ số 2.
- Giữa kỳ: một điểm, hệ số 3.
- Cuối kỳ: một điểm, hệ số 3.

Công thức mặc định:

```text
avgOral = trung bình các điểm Miệng/15 phút
avgOnePeriod = trung bình các điểm 1 tiết

subjectAverage =
  (avgOral * 1 + avgOnePeriod * 2 + midtermScore * 3 + finalScore * 3) / 9
```

Rule:

- Điểm nằm trong `[minScore, maxScore]`, mặc định `0..10`.
- Không lưu điểm không phải số.
- Không nhập điểm cho học sinh không thuộc lớp tương ứng.
- GVBM chỉ nhập/sửa điểm nếu được phân công `SUBJECT` đúng lớp/môn/học kỳ.
- GVCN không được nhập điểm nếu không đồng thời là GVBM.
- Nếu bảng điểm `LOCKED`, GVBM không được sửa trực tiếp.
- Sau khi khóa, sửa điểm phải đi qua `score-change-requests`.
- Làm tròn điểm trung bình nhất quán, khuyến nghị 2 chữ số thập phân.

Trạng thái bảng điểm gợi ý:

```ts
DRAFT
SUBMITTED
LOCKED
NEEDS_CORRECTION
```

Endpoint gợi ý:

```http
GET  /api/v1/scores/sheets
POST /api/v1/scores/sheets
GET  /api/v1/scores/sheets/:id
PUT  /api/v1/scores/sheets/:id/students/:studentId
POST /api/v1/scores/sheets/:id/submit
POST /api/v1/scores/sheets/:id/lock
POST /api/v1/scores/sheets/:id/unlock
GET  /api/v1/scores/my-scores
GET  /api/v1/scores/class-scoreboard
```

### 7.11. `score-change-requests`

Chức năng:

- GVBM gửi yêu cầu sửa điểm khi bảng điểm đã khóa.
- Giáo vụ duyệt/từ chối yêu cầu.
- Lưu điểm cũ, điểm mới, lý do, người yêu cầu, người duyệt.
- Ghi audit log nếu có.

Rule:

- Chỉ GVBM được phân công đúng lớp/môn/học kỳ mới được gửi yêu cầu.
- Không tạo yêu cầu trùng chưa xử lý cho cùng học sinh/môn/loại điểm.
- Giáo vụ duyệt thì cập nhật điểm và tính lại trung bình.
- Từ chối thì giữ nguyên điểm cũ và lưu lý do.
- Không xóa yêu cầu đã xử lý.

Endpoint gợi ý:

```http
GET  /api/v1/score-change-requests
POST /api/v1/score-change-requests
POST /api/v1/score-change-requests/:id/approve
POST /api/v1/score-change-requests/:id/reject
```

### 7.12. `reports`

Chức năng:

- Báo cáo tổng kết môn.
- Báo cáo tổng kết học kỳ.
- Báo cáo tổng kết năm học nếu còn thời gian.

Rule:

- Báo cáo chính thức nên dùng dữ liệu đã khóa.
- Điểm đạt môn: `subjectAverage >= passSubjectScore`, mặc định 5.
- Điểm đạt học kỳ: `semesterAverage >= passSemesterScore`, mặc định 5.
- Tỷ lệ đạt = `số lượng đạt / sĩ số * 100`.
- Không chia cho 0.

Endpoint gợi ý:

```http
GET /api/v1/reports/subject-summary
GET /api/v1/reports/semester-summary
GET /api/v1/reports/year-summary
GET /api/v1/reports/subject-summary/export
GET /api/v1/reports/semester-summary/export
```

### 7.13. `parameters`

Chức năng:

- Quản lý tham số theo năm học.
- Thay đổi tuổi tối thiểu/tối đa, điểm tối thiểu/tối đa, sĩ số tối đa, điểm đạt, trọng số điểm.

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
- Điểm đạt nằm trong `[minScore, maxScore]`.
- Trọng số phải là số dương.
- Tham số nên gắn với năm học để tránh thay đổi làm sai dữ liệu cũ.

---

## 8. Kiểm tra quyền theo scope

Không chỉ check role kiểu:

```ts
@Roles('TEACHER')
```

Với giáo viên, phải check thêm assignment/scope.

### 8.1. Hàm kiểm tra quyền cần có

Nên tạo service hoặc helper, ví dụ `AuthorizationService`:

```ts
isHomeroomTeacherOfClass(teacherId, classId, schoolYearId)

isSubjectTeacherOfClass(teacherId, classId, subjectId, semesterId)

canViewClassStudents(user, classId, context)

canViewStudentProfile(user, studentId, context)

canViewStudentScores(user, studentId, context)

canEditScore(user, classId, subjectId, semesterId, scoreSheetStatus)

canRequestScoreChange(user, classId, subjectId, semesterId, scoreSheetStatus)

canApproveScoreChange(user)
```

### 8.2. Rule cụ thể

`ACADEMIC_STAFF`:

- Có quyền toàn trường với nghiệp vụ học vụ.

`MANAGER`:

- Xem báo cáo/toàn trường.
- Không nhập điểm.
- Không tự động được sửa dữ liệu học vụ.

`TEACHER` với `HOMEROOM`:

- Xem lớp chủ nhiệm.
- Xem điểm lớp chủ nhiệm.
- Không nhập điểm nếu không có `SUBJECT`.

`TEACHER` với `SUBJECT`:

- Xem lớp/môn được phân công.
- Nhập/sửa điểm môn được phân công khi chưa khóa.
- Gửi yêu cầu sửa điểm khi đã khóa.

`STUDENT`:

- Chỉ xem dữ liệu của chính mình.

---

## 9. Database model khuyến nghị

Tên model có thể dùng tiếng Anh để code dễ maintain, nhưng phải map được với tài liệu tiếng Việt.

### 9.1. Mapping bảng nghiệp vụ

| Tài liệu | Prisma model gợi ý | Ý nghĩa |
|---|---|---|
| NGUOIDUNG | User | Người dùng |
| QUYEN/NHOMNGUOIDUNG | Role/Permission | Vai trò/quyền |
| HOCSINH | Student | Học sinh |
| GIAOVIEN | Teacher | Giáo viên |
| KHOILOP | GradeLevel | Khối lớp |
| LOP | Class | Lớp học |
| HOCSINH_LOP | StudentClassEnrollment | Học sinh thuộc lớp |
| MONHOC | Subject | Môn học |
| HOCKY | Semester | Học kỳ |
| NAMHOC | SchoolYear/AcademicYear | Năm học |
| PHANCONG_GIAOVIEN | TeacherAssignment | Phân công GVCN/GVBM |
| BANGDIEMMON | ScoreSheet | Bảng điểm môn |
| CT_BANGDIEMMON_HOCSINH | StudentSubjectScore | Điểm tổng hợp môn của học sinh |
| CT_DIEM_THANHPHAN | ScoreDetail | Điểm thành phần |
| YEUCAU_SUADIEM | ScoreChangeRequest | Yêu cầu sửa điểm |
| BAOCAOTKMON | SubjectReport | Báo cáo môn |
| BAOCAOTKHK | SemesterReport | Báo cáo học kỳ |
| THAMSO | SystemParameter | Tham số hệ thống |
| AUDIT_LOG | AuditLog | Nhật ký thao tác |

### 9.2. Enum gợi ý

```ts
UserStatus = ACTIVE | LOCKED | DISABLED

StudentStatus =
  PENDING_CLASS_ASSIGNMENT
  ACTIVE
  SUSPENDED
  TRANSFERRED
  GRADUATED
  INACTIVE

TeacherAssignmentType = HOMEROOM | SUBJECT

EnrollmentStatus = ACTIVE | TRANSFERRED | COMPLETED | INACTIVE

ScoreSheetStatus = DRAFT | SUBMITTED | LOCKED | NEEDS_CORRECTION

ScoreChangeRequestStatus = PENDING | APPROVED | REJECTED

AssessmentType =
  ORAL_15M
  ONE_PERIOD
  MIDTERM
  FINAL
```

### 9.3. Unique constraint quan trọng

Agent phải ưu tiên các ràng buộc sau:

- `User.username` unique.
- `User.email` unique nếu email bắt buộc.
- `Student.studentCode` unique.
- `Student.email` unique nếu dùng email cho học sinh.
- `Teacher.teacherCode` unique nếu có.
- `Class.name + schoolYearId` unique.
- `Subject.code` unique hoặc `Subject.name` unique.
- `Semester.name + schoolYearId` unique.
- Một học sinh chỉ có một enrollment active trong cùng semester/schoolYear.
- `ScoreSheet.classId + subjectId + semesterId + schoolYearId` unique.
- `StudentSubjectScore.scoreSheetId + studentId` unique.
- `TeacherAssignment` không trùng active cho cùng teacher/class/subject/semester/type.
- Một class chỉ có một `HOMEROOM` active trong cùng schoolYear.
- Một class/subject/semester chỉ có một `SUBJECT` teacher chính nếu chưa hỗ trợ đồng giảng dạy.

---

## 10. API convention

### 10.1. Prefix

Backend dùng global prefix:

```text
/api/v1
```

Endpoint trong docs nên ghi đầy đủ `/api/v1/...` hoặc ghi rõ đã có prefix.

### 10.2. Response format

Response thành công:

```json
{
  "data": {},
  "message": "Success"
}
```

Response phân trang:

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

Response lỗi:

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

### 10.3. Endpoint nhóm chính

Auth:

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Users:

```http
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
PATCH  /api/v1/users/:id/reset-password
DELETE /api/v1/users/:id
```

Students:

```http
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/:id
PATCH  /api/v1/students/:id
DELETE /api/v1/students/:id
```

Classes/academic setup:

```http
GET  /api/v1/academic-years
POST /api/v1/academic-years
GET  /api/v1/semesters
POST /api/v1/semesters
GET  /api/v1/grade-levels
POST /api/v1/grade-levels
GET  /api/v1/classes
POST /api/v1/classes
GET  /api/v1/classes/:id
GET  /api/v1/classes/:id/students
GET  /api/v1/subjects
POST /api/v1/subjects
```

Enrollments:

```http
POST /api/v1/enrollments/assign
POST /api/v1/enrollments/transfer
GET  /api/v1/enrollments
```

Teacher assignments:

```http
GET    /api/v1/teacher-assignments
POST   /api/v1/teacher-assignments/homeroom
POST   /api/v1/teacher-assignments/subject
DELETE /api/v1/teacher-assignments/:id
```

Scores:

```http
GET  /api/v1/scores/sheets
POST /api/v1/scores/sheets
GET  /api/v1/scores/sheets/:id
PUT  /api/v1/scores/sheets/:id/students/:studentId
POST /api/v1/scores/sheets/:id/submit
POST /api/v1/scores/sheets/:id/lock
GET  /api/v1/scores/my-scores
GET  /api/v1/scores/class-scoreboard
```

Score change requests:

```http
GET  /api/v1/score-change-requests
POST /api/v1/score-change-requests
POST /api/v1/score-change-requests/:id/approve
POST /api/v1/score-change-requests/:id/reject
```

Reports:

```http
GET /api/v1/reports/subject-summary
GET /api/v1/reports/semester-summary
GET /api/v1/reports/year-summary
```

Parameters:

```http
GET   /api/v1/parameters
GET   /api/v1/parameters/current
POST  /api/v1/parameters
PATCH /api/v1/parameters/:id
```

---

## 11. UI/UX định hướng

Giao diện cần giữ phong cách:

- Sạch, sáng, dễ dùng.
- Sidebar trái cho dashboard theo role.
- Card chức năng nhanh ở trang chủ.
- Table/DataGrid cho danh sách.
- Form modal/popup cho thêm/sửa nhanh.
- Badge thể hiện trạng thái, role, xếp loại.
- Có loading, empty state, error state.
- Backend error phải hiển thị rõ.

### 11.1. Dashboard Giáo vụ

Nên có:

- Tổng số học sinh.
- Tổng số lớp.
- Số học sinh chờ phân lớp.
- Bảng điểm chưa khóa.
- Yêu cầu sửa điểm chờ duyệt.
- Lối tắt: học sinh, lớp, phân lớp, chuyển lớp, phân công GV, khóa điểm, báo cáo.

### 11.2. Dashboard Giáo viên

Phải phân biệt scope:

- Nếu là GVCN: hiển thị lớp chủ nhiệm.
- Nếu là GVBM: hiển thị danh sách lớp/môn đang dạy.
- Nếu vừa là GVCN vừa là GVBM: hiển thị cả hai nhóm chức năng.
- Không hiển thị nút nhập điểm nếu giáo viên không có assignment `SUBJECT`.

### 11.3. Dashboard Học sinh

Nên có:

- Thông tin cá nhân.
- Lớp hiện tại.
- Điểm cá nhân.
- Thông báo nếu có.

### 11.4. Dashboard Admin

Nên có:

- Quản lý tài khoản.
- Quản lý role/permission.
- Cấu hình hệ thống.
- Audit/system log nếu có.

### 11.5. Dashboard BGH/Manager

Nên có:

- Báo cáo môn.
- Báo cáo học kỳ.
- Báo cáo năm học.
- Thống kê toàn trường.

---

## 12. Business rules bắt buộc

### 12.1. Tiếp nhận học sinh

- Họ tên, ngày sinh, giới tính, ngày tiếp nhận bắt buộc.
- Tuổi nằm trong `[minAge, maxAge]`.
- Email đúng định dạng nếu có.
- Không tạo học sinh trùng rõ ràng.
- Học sinh mới ở trạng thái chờ phân lớp.

### 12.2. Phân lớp

- Chỉ Giáo vụ được phân lớp.
- Học sinh phải ở trạng thái chờ phân lớp hoặc cần phân lớp lại.
- Không vượt sĩ số lớp.
- Một học sinh không có hai lớp active trong cùng học kỳ/năm học.
- Ghi lịch sử phân lớp.

### 12.3. Chuyển lớp

- Chỉ Giáo vụ được chuyển lớp.
- Lớp đích phải còn chỗ.
- Không chuyển sang lớp khác khối nếu không thuộc quy trình lên lớp/ở lại lớp.
- Không mất lịch sử lớp cũ.
- Dùng transaction để cập nhật lớp cũ, lớp mới và sĩ số.

### 12.4. Phân công giáo viên

- Một lớp chỉ có một GVCN active trong cùng năm học.
- Một giáo viên không nên chủ nhiệm nhiều lớp cùng năm học.
- GVBM gắn với lớp + môn + học kỳ.
- Một giáo viên có thể vừa là GVCN vừa là GVBM.
- Phân công là cơ sở để kiểm tra quyền nhập/xem điểm.

### 12.5. Nhập điểm

- Chỉ GVBM được phân công đúng lớp/môn/học kỳ mới được nhập điểm.
- Điểm phải là số trong miền cấu hình, mặc định 0..10.
- Không nhập điểm cho học sinh không thuộc lớp.
- Điểm trung bình tính theo trọng số cấu hình.
- Khi thiếu điểm, có thể lưu nháp nhưng không được hoàn tất/khóa nếu thiếu điểm bắt buộc.
- GVCN chỉ xem điểm lớp chủ nhiệm, không sửa điểm nếu không là GVBM môn đó.

### 12.6. Khóa bảng điểm

- Chỉ Giáo vụ được khóa bảng điểm.
- Không khóa nếu còn thiếu điểm bắt buộc, trừ khi có lý do ngoại lệ.
- Sau khi khóa, GVBM không được sửa trực tiếp.
- Báo cáo chính thức nên dùng bảng điểm đã khóa.

### 12.7. Yêu cầu sửa điểm

- GVBM gửi yêu cầu sửa điểm sau khi khóa.
- Yêu cầu phải có điểm cũ, điểm mới, lý do.
- Giáo vụ duyệt/từ chối.
- Duyệt thì cập nhật điểm và tính lại trung bình.
- Mọi thao tác phải ghi log nếu module audit có sẵn.

### 12.8. Báo cáo

- Báo cáo môn theo lớp/môn/học kỳ.
- Báo cáo học kỳ theo lớp/khối/toàn trường.
- Tỷ lệ đạt tính dựa trên sĩ số thực tế.
- Không chia cho 0.
- Báo cáo chính thức ưu tiên dữ liệu đã khóa.

---

## 13. Seed data tối thiểu

Seed phải đủ để demo ngay sau khi migrate.

### 13.1. Tài khoản demo

```text
Admin:
  username: admin
  password: Admin@123
  role: ADMIN

Giáo vụ:
  username: giaovu01
  password: Staff@123
  role: ACADEMIC_STAFF

BGH/Manager:
  username: manager01
  password: Manager@123
  role: MANAGER

Giáo viên 1:
  username: teacher01
  password: Teacher@123
  role: TEACHER
  assignment:
    - HOMEROOM lớp 10A1 năm học 2024-2025
    - SUBJECT môn Toán lớp 10A1 học kỳ I

Giáo viên 2:
  username: teacher02
  password: Teacher@123
  role: TEACHER
  assignment:
    - SUBJECT môn Văn lớp 10A1 học kỳ I

Học sinh:
  username: student01
  password: Student@123
  role: STUDENT
  enrollment:
    - lớp 10A1 học kỳ I
```

### 13.2. Dữ liệu học vụ

- Năm học: `2024-2025`.
- Học kỳ: `I`, `II`.
- Khối lớp: `10`, `11`, `12`.
- Lớp: `10A1`, `10A2`, `11A1`, `12A1`.
- Môn học: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa.
- Tham số: minAge 15, maxAge 20, maxClassSize 40, minScore 0, maxScore 10, passSubjectScore 5, passSemesterScore 5.
- Một số học sinh mẫu thuộc lớp 10A1.
- Một bảng điểm mẫu môn Toán học kỳ I.

---

## 14. Quy trình làm việc với Git

### 14.1. Branch

- `main`: bản ổn định để nộp/demo.
- `develop`: bản tích hợp chung.
- `feature/backend-auth-rbac`.
- `feature/backend-students`.
- `feature/backend-enrollments`.
- `feature/backend-teacher-assignments`.
- `feature/backend-scores`.
- `feature/frontend-login`.
- `fix/prisma-seed`.

### 14.2. Quy trình task

1. Pull code mới nhất từ `develop`.
2. Tạo branch theo task.
3. Đọc `AGENTS.md` và docs liên quan.
4. Implement nhỏ, test từng bước.
5. Chạy lint/test/build nếu có.
6. Cập nhật docs nếu API/database/business rule đổi.
7. Commit message rõ ràng.
8. Mở PR hoặc merge về `develop` sau khi kiểm tra.

### 14.3. Commit message

```text
feat(auth): implement login api
feat(rbac): add academic staff role
feat(assignments): separate homeroom and subject teacher scopes
feat(scores): enforce subject teacher score editing rule
fix(seed): add demo academic staff and teacher assignments
docs(api): update enrollment and score endpoints
```

---

## 15. Quy trình làm việc cho AI agent/Codex

### Bước 1 — Hiểu task

- Xác định task thuộc backend, frontend, database hay docs.
- Tìm file liên quan.
- Kiểm tra docs trước khi sửa.
- Nếu có mâu thuẫn giữa code và docs, ưu tiên nghiệp vụ đã chốt trong `AGENTS.md`, sau đó cập nhật docs cho thống nhất.

### Bước 2 — Lập kế hoạch nhỏ

Không sửa lan man. Chỉ chạm vào file cần thiết.

Ví dụ task “làm phân quyền GVCN/GVBM” chỉ nên đụng:

- `auth/guards` hoặc `common/guards`.
- `teacher-assignments`.
- service kiểm tra quyền.
- module liên quan như `scores`, `classes`.
- seed nếu cần dữ liệu demo.
- docs authorization/API.

### Bước 3 — Implement

- Viết code rõ ràng, type-safe.
- Không dùng `any` nếu không cần.
- Business rule nằm ở service.
- Dùng transaction khi tạo/cập nhật nhiều record liên quan.
- Không hardcode dữ liệu demo vào business logic.
- Không bỏ qua edge case phân quyền theo scope.

### Bước 4 — Kiểm tra

Agent phải tự kiểm tra tối thiểu:

- TypeScript compile nếu có thể.
- Lint nếu có script.
- Test nếu có script.
- Prisma generate/migrate nếu đụng schema.
- Frontend build nếu đụng UI lớn.
- Test thủ công bằng Swagger/Postman nếu API mới.

### Bước 5 — Báo cáo kết quả

Khi hoàn thành, agent phải nêu:

- Đã sửa file nào.
- Đã thêm/chỉnh chức năng gì.
- Cách test/chạy.
- Còn rủi ro/gợi ý tiếp theo nào.

---

## 16. Coding standards backend

### 16.1. Controller

Controller chỉ nên:

- Nhận params/query/body.
- Gọi service.
- Trả kết quả.

Không viết logic tính điểm, rule tuổi, rule sĩ số, rule GVCN/GVBM trong controller.

### 16.2. DTO

DTO phải validate:

- Required field.
- Type.
- String length nếu cần.
- Enum nếu có.
- Number range cơ bản.
- Date string nếu là ngày.

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

### 16.3. Service

Service chịu trách nhiệm:

- Kiểm tra business rule.
- Kiểm tra quyền nghiệp vụ nếu guard chưa đủ.
- Gọi Prisma.
- Transaction.
- Throw exception rõ ràng.

### 16.4. Exception

Dùng exception chuẩn NestJS:

- `BadRequestException` cho dữ liệu sai/rule sai.
- `UnauthorizedException` cho chưa đăng nhập.
- `ForbiddenException` cho không có quyền.
- `NotFoundException` cho không tìm thấy.
- `ConflictException` cho trùng dữ liệu.

---

## 17. Coding standards frontend

### 17.1. Component

- Component nhỏ, dễ đọc.
- Page component không chứa quá nhiều logic phức tạp.
- API call tách ra `services` hoặc `api` layer.
- Type response rõ ràng.

### 17.2. Form

- Hiển thị lỗi dưới field.
- Disable submit khi loading.
- Không submit nhiều lần liên tục.
- Sau submit thành công: toast + refetch/navigate.

### 17.3. Table

- Có loading state.
- Có empty state.
- Có error state.
- Có confirm modal khi xóa.
- Không xóa cứng nếu backend báo không cho phép.

### 17.4. Auth UI

- Token lưu nhất quán.
- Khi token hết hạn hoặc API trả 401, chuyển về login.
- Menu theo role và scope.
- Route protection theo role.
- Không hiển thị màn hình nhập điểm nếu giáo viên không có assignment `SUBJECT`.

---

## 18. Tài liệu phải giữ thống nhất

| Khi thay đổi | File cần cập nhật |
|---|---|
| API endpoint | `docs/api-spec.md` |
| Database schema | `docs/database.md`, `backend/prisma/schema.prisma` |
| Business rule | `docs/business-rules.md` |
| Phân quyền | `docs/authorization.md` |
| Giao diện/màn hình | `docs/ui-spec.md` |
| Seed data | `docs/seed-data.md`, `backend/prisma/seed.ts` |
| Quy trình làm việc | `docs/workflow.md` hoặc `AGENTS.md` |

Không để tình trạng API trong code khác với `api-spec.md`.

---

## 19. Tiêu chuẩn hoàn thành tính năng

Một tính năng chỉ được xem là hoàn thành khi:

1. Backend endpoint chạy được.
2. Validate dữ liệu đúng.
3. Business rule được enforce ở backend.
4. Phân quyền role/scope được kiểm tra đúng.
5. Frontend gọi được API thật nếu task có UI.
6. UI có loading/error/success state nếu task có UI.
7. Seed/test data đủ để demo.
8. Docs liên quan được cập nhật.
9. Không phá chức năng đã có.

---

## 20. Checklist demo cuối kỳ

### Flow Admin

1. Đăng nhập `admin / Admin@123`.
2. Xem/quản lý tài khoản.
3. Xem role/permission.
4. Khóa/mở tài khoản nếu có.

### Flow Giáo vụ

1. Đăng nhập `giaovu01 / Staff@123`.
2. Tiếp nhận học sinh.
3. Phân học sinh vào lớp 10A1.
4. Chuyển học sinh sang lớp khác.
5. Phân công `teacher01` làm GVCN 10A1.
6. Phân công `teacher01` dạy Toán 10A1 học kỳ I.
7. Phân công `teacher02` dạy Văn 10A1 học kỳ I.
8. Khóa bảng điểm Toán.
9. Duyệt/từ chối yêu cầu sửa điểm.
10. Xem báo cáo môn/học kỳ.

### Flow Teacher — GVCN + GVBM

1. Đăng nhập `teacher01 / Teacher@123`.
2. Thấy lớp chủ nhiệm 10A1.
3. Xem danh sách học sinh lớp chủ nhiệm.
4. Xem điểm lớp chủ nhiệm.
5. Chọn môn Toán 10A1 học kỳ I.
6. Nhập/cập nhật điểm Toán nếu bảng điểm chưa khóa.
7. Nếu bảng điểm đã khóa, gửi yêu cầu sửa điểm.

### Flow Teacher — chỉ GVBM

1. Đăng nhập `teacher02 / Teacher@123`.
2. Thấy lớp/môn được phân công: Văn 10A1.
3. Nhập điểm Văn 10A1.
4. Không xem/sửa điểm Toán nếu không được phân công.
5. Không xem toàn bộ điểm lớp như GVCN.

### Flow Student

1. Đăng nhập `student01 / Student@123`.
2. Xem thông tin cá nhân.
3. Xem lớp hiện tại.
4. Xem điểm cá nhân.
5. Không xem điểm học sinh khác.

---

## 21. Những điều agent không được làm

- Không đổi project sang framework khác.
- Không xóa dữ liệu seed quan trọng.
- Không thay đổi công thức điểm nếu không có yêu cầu.
- Không hardcode role ở frontend mà backend không kiểm tra.
- Không bỏ qua kiểm tra scope GVCN/GVBM.
- Không cho GVCN nhập điểm chỉ vì là giáo viên chủ nhiệm.
- Không cho GVBM xem/sửa điểm môn khác.
- Không bỏ qua migration khi sửa schema.
- Không commit `.env` thật.
- Không lưu password plain text.
- Không tạo tính năng quá lớn làm trễ P0.
- Không refactor toàn repo khi task chỉ yêu cầu sửa một lỗi nhỏ.
- Không sửa docs cho đẹp nhưng code không chạy.
- Không mở rộng thành LMS/đại học/hệ thống học phí.

---

## 22. Prompt mẫu để giao việc cho Codex/AI agent

```text
Bạn đang làm trong dự án Student Management System SE104, branch develop.

Trước khi code, hãy đọc AGENTS.md và các docs liên quan.

Task: [mô tả task cụ thể]

Yêu cầu:
- Không đổi scope ngoài task.
- Bám theo business rules trong AGENTS.md.
- GVCN và GVBM không phải hai tài khoản riêng; chúng là assignment của TEACHER.
- Nếu sửa API, cập nhật docs/api-spec.md.
- Nếu sửa phân quyền, cập nhật docs/authorization.md.
- Nếu sửa database, cập nhật Prisma schema, migration/seed nếu cần.
- Sau khi sửa, nêu rõ file đã chỉnh và cách test.
```

Ví dụ task phân quyền GVCN/GVBM:

```text
Task: Implement phân quyền GVCN/GVBM cho module scores.

Yêu cầu nghiệp vụ:
- User role TEACHER chỉ được nhập điểm nếu có TeacherAssignment type SUBJECT đúng classId, subjectId, semesterId.
- GVCN chỉ được xem điểm lớp chủ nhiệm, không được nhập/sửa điểm nếu không có SUBJECT assignment.
- Một giáo viên có thể vừa là HOMEROOM vừa là SUBJECT.
- Nếu ScoreSheet đã LOCKED, GVBM không được sửa trực tiếp, chỉ được tạo ScoreChangeRequest.
- Giáo vụ có quyền khóa bảng điểm và duyệt/từ chối ScoreChangeRequest.
- Cập nhật docs/api-spec.md và docs/authorization.md.
```

---

## 23. Ghi chú cho nhóm sinh viên

Dự án nên ưu tiên **đúng nghiệp vụ, chạy ổn, demo rõ ràng** hơn là cố làm quá nhiều tính năng.

Nếu còn ít thời gian, tập trung hoàn thiện:

1. Auth + role.
2. Seed ổn định.
3. Học sinh/lớp/phân lớp/chuyển lớp.
4. Phân công GVCN/GVBM.
5. Nhập điểm theo GVBM.
6. Khóa điểm + yêu cầu sửa điểm.
7. Tra cứu điểm theo đúng scope.
8. Báo cáo tổng kết.
9. UI đủ giống báo cáo và dễ thuyết trình.

Một tính năng nhỏ nhưng chạy chắc chắn có giá trị hơn một tính năng lớn nhưng lỗi nhiều.
