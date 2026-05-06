# Architecture - Kiến trúc hệ thống Quản lý học sinh

## 1. Mục tiêu kiến trúc

Hệ thống cần dễ làm trong 2 tuần, dễ demo, dễ chia việc cho nhóm 3 người và đủ khả năng mở rộng sau MVP.

Kiến trúc đề xuất:

```text
React Frontend → REST API NestJS → Prisma ORM → PostgreSQL
```

## 2. Tổng quan thành phần

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React + Vite + TypeScript | Giao diện người dùng |
| Backend | NestJS + TypeScript | API, business logic, auth |
| ORM | Prisma | Truy cập database |
| Database | PostgreSQL | Lưu dữ liệu hệ thống |
| Auth | JWT + bcrypt | Đăng nhập, bảo vệ API |
| Docs | Markdown | Thống nhất yêu cầu, API, test |

## 3. Luồng request

```text
User thao tác UI
→ Frontend gọi API
→ Controller nhận request
→ DTO validate dữ liệu cơ bản
→ Service xử lý business rules
→ Prisma truy vấn database
→ Service trả kết quả
→ Controller trả response
→ Frontend hiển thị
```

## 4. Backend module đề xuất

```text
backend/src/
  auth/
  users/
  prisma/
  students/
  classes/
  subjects/
  school-years/
  semesters/
  grade-levels/
  parameters/
  score-sheets/
  reports/
  teacher-assignments/
  common/
```

## 5. Trách nhiệm từng layer backend

| Layer | Trách nhiệm | Không nên làm |
|---|---|---|
| Controller | Nhận request, gọi service, trả response | Không viết business logic phức tạp |
| DTO | Validate format, field bắt buộc | Không query database |
| Service | Business rules, transaction, tính toán | Không xử lý UI |
| PrismaService | Kết nối database | Không chứa nghiệp vụ |
| Guard | Kiểm tra auth/role | Không xử lý dữ liệu nghiệp vụ |

## 6. Frontend structure đề xuất

```text
frontend/src/
  components/
    common/
    layout/
  pages/
    auth/
    dashboard/
    students/
    classes/
    scores/
    reports/
    users/
  services/
    api.ts
    auth.service.ts
    students.service.ts
    classes.service.ts
    scores.service.ts
    reports.service.ts
  types/
  hooks/
  utils/
```

## 7. Quy ước API

- Base URL đề xuất: `http://localhost:3000/api/v1`.
- Backend nên thêm trong `main.ts`:

```ts
app.setGlobalPrefix('api/v1');
```

- Dùng JSON cho request/response.
- API cần JWT thì gửi header:

```http
Authorization: Bearer <access_token>
```

## 8. Auth architecture

```text
POST /auth/login
→ kiểm tra username/password
→ bcrypt.compare
→ tạo JWT payload { sub, username, role }
→ trả access_token + user
```

Frontend lưu token tạm trong localStorage/sessionStorage cho MVP.

## 9. Role-based access MVP

| Role | Quyền MVP |
|---|---|
| ADMIN | Toàn quyền quản lý dữ liệu, người dùng, tham số, báo cáo |
| TEACHER | Xem lớp, nhập điểm, tra cứu học sinh/điểm |
| STUDENT | Xem điểm và lớp cá nhân |

## 10. Module ưu tiên 2 tuần

Thứ tự hiện thực:

1. Auth.
2. Seed data.
3. Students.
4. Classes + Enrollment.
5. Scores.
6. Lookup.
7. Reports.
8. Users/Permissions đơn giản.
9. Docs + QA.

## 11. Nguyên tắc transaction

Nên dùng transaction cho các nghiệp vụ:

- Thêm học sinh vào lớp và cập nhật sĩ số.
- Lưu bảng điểm gồm nhiều học sinh/nhiều điểm chi tiết.
- Chỉnh sửa điểm và tính lại trung bình.
- Thay đổi tham số có ghi log.

## 12. Nguyên tắc lỗi

Backend trả lỗi thống nhất:

```json
{
  "statusCode": 400,
  "message": "Tuổi học sinh không nằm trong khoảng cho phép",
  "error": "Bad Request"
}
```

Frontend không hiển thị lỗi kỹ thuật thô cho người dùng cuối.
