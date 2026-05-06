# Test Plan - Kế hoạch kiểm thử hệ thống Quản lý học sinh

## 1. Mục tiêu kiểm thử

Đảm bảo MVP có thể demo ổn định theo luồng chính:

```text
Đăng nhập → Quản lý học sinh → Phân lớp → Nhập điểm → Tra cứu điểm → Báo cáo
```

## 2. Phạm vi kiểm thử

### Có kiểm thử

- Auth và phân quyền cơ bản.
- CRUD học sinh.
- Lớp học và phân lớp.
- Nhập điểm và tính điểm trung bình.
- Tra cứu điểm.
- Báo cáo môn/học kỳ.
- Tham số hệ thống.

### Chưa bắt buộc trong MVP

- Load test.
- Security test chuyên sâu.
- Automated e2e test đầy đủ.
- Kiểm thử mobile responsive.

## 3. Môi trường test

- Backend: `http://localhost:3000` hoặc `http://localhost:3000/api/v1`.
- Frontend: `http://localhost:5173`.
- Database: PostgreSQL qua Docker.
- Công cụ: Swagger, Postman, browser, Prisma Studio nếu cần.

## 4. Tài khoản demo

| Role | Username | Password | Ghi chú |
|---|---|---|---|
| ADMIN | admin | Admin@123 | Quản lý toàn hệ thống |
| TEACHER | teacher01 | Teacher@123 | Nhập điểm |
| STUDENT | student01 | Student@123 | Tra cứu điểm cá nhân |

## 5. Test cases

### TC-AUTH-01. Đăng nhập thành công

- Bước:
  1. Nhập username/password đúng.
  2. Bấm đăng nhập.
- Kết quả mong đợi:
  - Trả JWT token.
  - Điều hướng đúng dashboard theo role.

### TC-AUTH-02. Đăng nhập sai mật khẩu

- Kết quả mong đợi:
  - Trả 401.
  - Frontend hiển thị thông báo dễ hiểu.

### TC-STU-01. Thêm học sinh hợp lệ

- Dữ liệu:
  - Họ tên: Nguyễn Văn An.
  - Ngày sinh: nằm trong tuổi 15-20.
- Kết quả mong đợi:
  - Học sinh được lưu.
  - Xuất hiện trong danh sách.

### TC-STU-02. Thêm học sinh dưới tuổi tối thiểu

- Kết quả mong đợi:
  - Backend trả 400.
  - Không lưu học sinh.

### TC-STU-03. Thêm học sinh quá tuổi tối đa

- Kết quả mong đợi:
  - Backend trả 400.
  - Không lưu học sinh.

### TC-STU-04. Trùng mã học sinh

- Kết quả mong đợi:
  - Backend trả 409 hoặc 400.
  - Không tạo bản ghi mới.

### TC-CLS-01. Tạo lớp hợp lệ

- Kết quả mong đợi:
  - Lớp được lưu.
  - Hiển thị trong danh sách lớp.

### TC-CLS-02. Tạo lớp trùng tên trong cùng năm học

- Kết quả mong đợi:
  - Backend từ chối.

### TC-ENR-01. Thêm học sinh vào lớp

- Điều kiện:
  - Học sinh ACTIVE.
  - Lớp chưa đủ sĩ số.
- Kết quả mong đợi:
  - Học sinh xuất hiện trong danh sách lớp.

### TC-ENR-02. Thêm học sinh trùng học kỳ

- Kết quả mong đợi:
  - Backend từ chối vì học sinh đã có lớp trong học kỳ.

### TC-ENR-03. Lớp vượt sĩ số

- Kết quả mong đợi:
  - Backend từ chối thêm học sinh.

### TC-SCO-01. Nhập bảng điểm hợp lệ

- Dữ liệu:
  - Điểm trong khoảng 0-10.
- Kết quả mong đợi:
  - Lưu điểm.
  - Tính đúng điểm trung bình.

### TC-SCO-02. Nhập điểm âm

- Kết quả mong đợi:
  - Backend trả 400.

### TC-SCO-03. Nhập điểm lớn hơn 10

- Kết quả mong đợi:
  - Backend trả 400.

### TC-SCO-04. Tính điểm trung bình môn

- Dữ liệu:
  - Miệng/15p: 8
  - 1 tiết: 7
  - Giữa kỳ: 8
  - Cuối kỳ: 9
- Công thức:

```text
(9*3 + 8*3 + 7*2 + 8*1) / 9 = 8.11
```

- Kết quả mong đợi:
  - `averageScore` xấp xỉ 8.11.

### TC-LOOKUP-01. Học sinh tra cứu điểm cá nhân

- Kết quả mong đợi:
  - Chỉ thấy điểm của chính mình.

### TC-LOOKUP-02. Giáo viên tra cứu điểm lớp

- Kết quả mong đợi:
  - Thấy bảng điểm của lớp/môn/học kỳ.

### TC-RPT-01. Báo cáo tổng kết môn

- Kết quả mong đợi:
  - Có số lượng đạt và tỉ lệ đạt theo lớp.

### TC-RPT-02. Báo cáo học kỳ khi chưa có dữ liệu

- Kết quả mong đợi:
  - Không crash.
  - Trả mảng rỗng hoặc số liệu 0.

## 6. Checklist trước khi demo

- [ ] Chạy được database.
- [ ] Chạy được backend.
- [ ] Chạy được frontend.
- [ ] Seed data thành công.
- [ ] Login admin/teacher/student được.
- [ ] Thêm học sinh được.
- [ ] Thêm học sinh vào lớp được.
- [ ] Nhập điểm được.
- [ ] Tra cứu điểm được.
- [ ] Báo cáo chạy được.
- [ ] README có hướng dẫn chạy.
- [ ] Có script demo 5-7 phút.

## 7. Quy tắc ghi bug

Bug report nên có:

```text
Tên bug:
Môi trường:
Bước tái hiện:
Kết quả thực tế:
Kết quả mong đợi:
Ảnh chụp/log:
Người phụ trách:
Mức độ: Critical/High/Medium/Low
```
