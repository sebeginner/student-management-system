# Sprint Plan - Kế hoạch 2 tuần cho nhóm 3 người

## 1. Mục tiêu sprint

Trong 2 tuần, nhóm cần hoàn thành MVP có thể demo:

```text
Đăng nhập → Quản lý học sinh → Phân lớp → Nhập điểm → Tra cứu điểm → Báo cáo
```

## 2. Phân vai

| Thành viên | Vai trò | Trách nhiệm chính |
|---|---|---|
| Thành viên 1 | Backend lead | API, business rules, auth, scores, reports |
| Thành viên 2 | Frontend lead | UI, gọi API, layout, form, table |
| Thành viên 3 | DB/Docs/QA | Seed data, docs, test case, demo script, kiểm tra tích hợp |

## 3. Nguyên tắc làm việc

- Không push trực tiếp vào `main`.
- Làm việc trên branch `feature/*`.
- Merge qua Pull Request vào `develop`.
- Cuối ngày phải tích hợp và test nhanh.
- Một chức năng chỉ xem là xong khi backend + frontend + database + test đều chạy được.

## 4. Timeline tuần 1

### Ngày 1 - Setup và seed data

Backend:
- Kiểm tra backend chạy được.
- Cấu hình `.env.example`.
- Kiểm tra Prisma migrate.

Frontend:
- Xóa template Vite.
- Tạo layout cơ bản.
- Tạo cấu trúc thư mục frontend.

DB/Docs/QA:
- Viết seed data.
- Tạo tài khoản demo.
- Viết README bản đầu.

Kết quả:
- Chạy được database, backend, frontend.

### Ngày 2 - Auth

Backend:
- `POST /auth/login`.
- `GET /auth/me`.
- JWT guard.
- Role guard đơn giản.

Frontend:
- Login page.
- Lưu token.
- Redirect theo role.

DB/Docs/QA:
- Test login đúng/sai.
- Cập nhật docs auth.

Kết quả:
- Đăng nhập được bằng 3 role.

### Ngày 3 - Master data và tham số

Backend:
- API school-years, semesters, subjects, grade-levels, classes, parameters.

Frontend:
- Màn hình dữ liệu nền cơ bản.
- Màn hình tham số.

DB/Docs/QA:
- Test dữ liệu seed hiển thị đúng.
- Cập nhật business rules.

### Ngày 4 - Students

Backend:
- `GET /students`.
- `POST /students`.
- `PATCH /students/:id`.
- Validate tuổi.

Frontend:
- Danh sách học sinh.
- Form thêm/sửa học sinh.

DB/Docs/QA:
- Test tuổi, email, mã trùng.

### Ngày 5 - Classes and enrollments

Backend:
- `GET /classes/:id/students`.
- `POST /classes/:id/students`.
- Kiểm tra sĩ số và trùng học kỳ.

Frontend:
- Màn hình lớp học.
- Thêm học sinh vào lớp.

DB/Docs/QA:
- Test sĩ số và trùng phân lớp.

### Ngày 6 - Score sheets

Backend:
- API bảng điểm.
- Tính điểm trung bình.
- Validate điểm 0-10.

Frontend:
- Màn hình nhập điểm.
- Hiển thị điểm trung bình.

DB/Docs/QA:
- Test công thức điểm.

### Ngày 7 - Lookup và demo thử lần 1

Backend:
- API tra cứu điểm học sinh/lớp.

Frontend:
- Màn hình tra cứu điểm cá nhân.
- Màn hình tra cứu điểm lớp.

DB/Docs/QA:
- Chạy demo thử.
- Ghi bug.

Kết quả cuối tuần 1:
- Demo được login → thêm học sinh → phân lớp → nhập điểm → tra cứu điểm.

## 5. Timeline tuần 2

### Ngày 8 - Báo cáo môn

Backend:
- `GET /reports/subject`.

Frontend:
- Màn hình báo cáo môn.

DB/Docs/QA:
- Test số lượng đạt, tỉ lệ đạt.

### Ngày 9 - Báo cáo học kỳ

Backend:
- `GET /reports/semester`.

Frontend:
- Màn hình báo cáo học kỳ.

DB/Docs/QA:
- Test báo cáo có dữ liệu/không dữ liệu.

### Ngày 10 - Users/roles đơn giản

Backend:
- API user cơ bản.

Frontend:
- Trang user nếu kịp.

DB/Docs/QA:
- Test tạo user, role redirect.

### Ngày 11 - Tích hợp và fix lỗi

Cả nhóm:
- Fix bug theo checklist.
- Đảm bảo develop chạy được.

### Ngày 12 - Hoàn thiện docs

Backend:
- Kiểm tra Swagger/API.

Frontend:
- Dọn UI.

DB/Docs/QA:
- Hoàn thiện README, docs, test-plan, demo script.

### Ngày 13 - Tổng duyệt demo

Cả nhóm:
- Chạy demo 5-7 phút.
- Chuẩn bị dữ liệu mẫu.
- Chụp màn hình nếu cần.

### Ngày 14 - Đóng băng bản nộp

Cả nhóm:
- Không thêm chức năng mới.
- Chỉ fix lỗi nhỏ.
- Merge `develop` vào `main`.
- Tag bản nộp nếu cần.

## 6. Definition of Done

Một task chỉ được xem là xong khi:

- [ ] Code đã push lên branch.
- [ ] Có Pull Request.
- [ ] Không làm hỏng build.
- [ ] API chạy được hoặc UI chạy được.
- [ ] Có test thủ công.
- [ ] Có cập nhật docs nếu thay đổi API/schema/rule.
- [ ] Đã merge vào `develop`.

## 7. Ưu tiên nếu thiếu thời gian

Giữ lại:

- Auth.
- Students.
- Classes.
- Scores.
- Score lookup.
- Subject report.
- README.
- Seed data.

Có thể đơn giản hóa:

- Users.
- Parameters.
- Semester report.
- Teacher assignment.

Có thể bỏ:

- Export file.
- Import file.
- Biểu đồ đẹp.
- Audit log đầy đủ.
- Phân quyền chi tiết.
