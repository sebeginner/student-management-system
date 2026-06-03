# SRS — Đặc tả yêu cầu phần mềm Quản lý học sinh SE104

## 1. Giới thiệu

Hệ thống Quản lý học sinh hỗ trợ nhà trường cấp 3 số hóa các nghiệp vụ: quản lý học sinh, lớp học, môn học, học kỳ, phân công giáo viên, nhập điểm, tra cứu điểm, báo cáo tổng kết và phân quyền người dùng.

Luồng demo chính:

```text
Đăng nhập → Quản lý học sinh → Phân lớp → Phân công GV → Nhập điểm → Khóa điểm → Yêu cầu sửa điểm → Tra cứu → Báo cáo
```

## 2. Phạm vi đã thực hiện

### 2.1. Có trong phạm vi (đã implement)

- Đăng nhập bằng tài khoản nội bộ (JWT).
- Phân quyền theo 5 role: ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER, STUDENT.
- Quản lý dữ liệu nền: năm học, học kỳ, khối lớp, lớp học, môn học, tham số hệ thống.
- Tiếp nhận và quản lý hồ sơ học sinh.
- Phân học sinh vào lớp, chuyển lớp.
- Phân công GVCN/GVBM cho giáo viên (qua `TeacherAssignment`).
- Nhập bảng điểm môn học (4 loại điểm: Miệng/15p, 1 tiết, Giữa kỳ, Cuối kỳ).
- Tính điểm trung bình môn theo công thức hệ số.
- Submit và khóa bảng điểm.
- Yêu cầu sửa điểm sau khi bảng điểm đã khóa (tạo → duyệt/từ chối).
- Tra cứu điểm cá nhân và theo lớp (phân quyền theo scope).
- Báo cáo tổng kết môn, học kỳ, cá nhân, dashboard.
- Chốt kết quả học kỳ và tổng kết năm học/xét lên lớp.
- Đánh giá hạnh kiểm học sinh (4 tiêu chí, 3 trạng thái DRAFT/SUBMITTED/FINALIZED).
- Thời khóa biểu theo lớp/học kỳ.
- Import học sinh và điểm từ Excel (2 bước: preview + commit).
- Xuất PDF bảng điểm lớp và phiếu kết quả cá nhân.
- Nhật ký hệ thống (audit log).
- Quản lý tài khoản người dùng (ADMIN).

### 2.2. Ngoài phạm vi

- Đăng ký học phần/tín chỉ/hệ đào tạo đại học.
- LMS: tài liệu học tập, bài tập online, chat lớp.
- Học phí/thanh toán.
- Phụ huynh portal.
- Multi-school/multi-tenant.
- Mobile app.
- Notification realtime.
- AI recommendation.

## 3. Actor và role

| Role | Tên hiển thị | Quyền chính |
|---|---|---|
| `ADMIN` | Quản trị viên | Tài khoản, role, tham số, audit log |
| `ACADEMIC_STAFF` | Giáo vụ | Toàn quyền nghiệp vụ học vụ |
| `MANAGER` | Ban giám hiệu | Xem báo cáo toàn trường (read-only) |
| `TEACHER` | Giáo viên | Quyền theo TeacherAssignment (GVCN/GVBM) |
| `STUDENT` | Học sinh | Xem dữ liệu cá nhân |

> **Lưu ý:** GVCN và GVBM không phải role đăng nhập riêng. Cùng là `TEACHER`, phân biệt qua `TeacherAssignment.assignmentType = HOMEROOM | SUBJECT`.

## 4. Yêu cầu chức năng

| Mã | Tên yêu cầu | Actor chính | Trạng thái |
|---|---|---|---|
| FR-01 | Đăng nhập | Tất cả | Done |
| FR-02 | Xem thông tin tài khoản hiện tại | Tất cả | Done |
| FR-03 | Quản lý tài khoản người dùng | ADMIN | Done |
| FR-04 | Quản lý học sinh | ACADEMIC_STAFF | Done |
| FR-05 | Quản lý lớp học | ACADEMIC_STAFF | Done |
| FR-06 | Phân học sinh vào lớp | ACADEMIC_STAFF | Done |
| FR-07 | Chuyển lớp học sinh | ACADEMIC_STAFF | Done |
| FR-08 | Quản lý môn học | ACADEMIC_STAFF, ADMIN | Done |
| FR-09 | Quản lý năm học, học kỳ | ACADEMIC_STAFF, ADMIN | Done |
| FR-10 | Quản lý tham số hệ thống | ACADEMIC_STAFF, ADMIN | Done |
| FR-11 | Phân công giáo viên (GVCN/GVBM) | ACADEMIC_STAFF | Done |
| FR-12 | Nhập bảng điểm môn học | TEACHER (GVBM) | Done |
| FR-13 | Tính điểm trung bình môn | System | Done |
| FR-14 | Submit bảng điểm | TEACHER (GVBM) | Done |
| FR-15 | Khóa bảng điểm | ACADEMIC_STAFF | Done |
| FR-16 | Yêu cầu sửa điểm | TEACHER (GVBM) | Done |
| FR-17 | Duyệt/từ chối yêu cầu sửa điểm | ACADEMIC_STAFF | Done |
| FR-18 | Tra cứu điểm cá nhân | STUDENT | Done |
| FR-19 | Tra cứu điểm theo lớp | TEACHER, ACADEMIC_STAFF | Done |
| FR-20 | Báo cáo tổng kết môn | ACADEMIC_STAFF, MANAGER, TEACHER | Done |
| FR-21 | Báo cáo tổng kết học kỳ | ACADEMIC_STAFF, MANAGER | Done |
| FR-22 | Dashboard tổng hợp | ACADEMIC_STAFF, MANAGER | Done |
| FR-23 | Chốt kết quả học kỳ | ACADEMIC_STAFF | Done |
| FR-24 | Tổng kết năm học / xét lên lớp | ACADEMIC_STAFF | Done |
| FR-25 | Đánh giá hạnh kiểm | TEACHER (GVCN), ACADEMIC_STAFF | Done |
| FR-26 | Thời khóa biểu | ACADEMIC_STAFF, TEACHER, STUDENT | Done |
| FR-27 | Import học sinh từ Excel | ACADEMIC_STAFF | Done |
| FR-28 | Import điểm từ Excel | ACADEMIC_STAFF, TEACHER | Done |
| FR-29 | Xuất PDF bảng điểm | ACADEMIC_STAFF, TEACHER | Done |
| FR-30 | Xuất PDF phiếu điểm cá nhân | STUDENT, ACADEMIC_STAFF | Done |
| FR-31 | Nhật ký hệ thống | ADMIN, ACADEMIC_STAFF | Done |

## 5. Yêu cầu phi chức năng

| Mã | Tên yêu cầu | Mô tả |
|---|---|---|
| NFR-01 | Bảo mật | Mọi API nghiệp vụ yêu cầu JWT hợp lệ |
| NFR-02 | Phân quyền | Backend enforce role + scope (TeacherAssignment); không chỉ dựa vào frontend |
| NFR-03 | Toàn vẹn dữ liệu | Không cho điểm ngoài khoảng, lớp vượt sĩ số, học sinh trùng lớp trong một HK |
| NFR-04 | Hiệu năng | Thao tác tra cứu/lưu MVP phản hồi đủ nhanh để demo (không yêu cầu load test) |
| NFR-05 | Dễ sử dụng | Giao diện rõ ràng, thông báo lỗi tiếng Việt dễ hiểu |
| NFR-06 | Dễ bảo trì | Backend chia module theo domain; frontend chia page/api-layer/component |
| NFR-07 | Khả năng tiến hóa | Tham số tuổi, sĩ số, điểm lưu trong `SystemParameter` theo năm học, không hardcode |
| NFR-08 | Truy vết | Ghi log các thao tác quan trọng: đăng nhập, sửa điểm, phân lớp, chốt kết quả |
| NFR-09 | Nhất quán dữ liệu | Các nghiệp vụ thay đổi nhiều bảng phải dùng transaction |
| NFR-10 | Idempotent seed | `npm run prisma:seed` chạy nhiều lần không tạo bản trùng |

## 6. Ràng buộc kỹ thuật

- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL.
- Frontend: React 19, Vite, TypeScript, TanStack Query, Tailwind CSS.
- Auth: JWT (Passport), bcrypt.
- API docs: Swagger tại `http://localhost:3000/api`.

## 7. Luồng demo mục tiêu

1. Đăng nhập `giaovu01` — xem tổng quan, phân lớp học sinh, xem phân công GV.
2. Đăng nhập `teacher01` — nhập điểm Toán/10A1/HK2; submit.
3. Đăng nhập `giaovu01` — khóa bảng điểm Vật lý/10A1/HK1; duyệt yêu cầu sửa điểm PENDING.
4. Đăng nhập `teacher01` — tạo yêu cầu sửa điểm trên bảng LOCKED.
5. Đăng nhập `student01` — xem điểm cá nhân.
6. Đăng nhập `manager01` — xem báo cáo, dashboard.
7. Đăng nhập `admin` — xem tài khoản, role, nhật ký.
