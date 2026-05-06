# SRS - Đặc tả yêu cầu phần mềm Quản lý học sinh

## 1. Giới thiệu

Hệ thống Quản lý học sinh hỗ trợ nhà trường số hóa các nghiệp vụ chính: quản lý học sinh, lớp học, môn học, học kỳ, bảng điểm, tra cứu điểm, báo cáo tổng kết và phân quyền người dùng.

Mục tiêu giai đoạn MVP là tạo được một hệ thống demo chạy được theo luồng:

```text
Đăng nhập → Quản lý học sinh → Phân lớp → Nhập điểm → Tra cứu điểm → Báo cáo
```

## 2. Phạm vi giai đoạn MVP

### 2.1. Có trong phạm vi

- Đăng nhập bằng tài khoản nội bộ.
- Phân quyền cơ bản theo vai trò: Admin/Manager, Teacher, Student.
- Quản lý dữ liệu nền: năm học, học kỳ, khối lớp, lớp học, môn học, tham số.
- Tiếp nhận và quản lý hồ sơ học sinh.
- Phân học sinh vào lớp theo học kỳ.
- Nhập bảng điểm môn học.
- Tính điểm trung bình môn.
- Tra cứu điểm cá nhân và điểm theo lớp.
- Lập báo cáo tổng kết môn.
- Lập báo cáo tổng kết học kỳ.
- Quản lý người dùng cơ bản.

### 2.2. Ngoài phạm vi MVP

- Import Excel hàng loạt.
- Export PDF/Excel nâng cao.
- Dashboard biểu đồ phức tạp.
- Phân quyền chi tiết đến từng nút chức năng.
- Thông báo real-time.
- Ứng dụng mobile.

## 3. Actor

| Actor | Mô tả |
|---|---|
| Admin/Manager | Quản lý hệ thống, dữ liệu nền, người dùng, tham số, báo cáo |
| Teacher | Xem lớp được phân công, nhập điểm, tra cứu học sinh/điểm |
| Student | Tra cứu điểm và xem thông tin lớp của bản thân |

## 4. Yêu cầu chức năng

| Mã | Tên yêu cầu | Actor | Ưu tiên |
|---|---|---|---|
| FR-01 | Đăng nhập | Admin, Teacher, Student | Must |
| FR-02 | Xem thông tin tài khoản hiện tại | Admin, Teacher, Student | Must |
| FR-03 | Quản lý học sinh | Admin/Manager | Must |
| FR-04 | Tra cứu học sinh | Admin/Manager, Teacher | Must |
| FR-05 | Quản lý lớp học | Admin/Manager | Must |
| FR-06 | Phân học sinh vào lớp | Admin/Manager, Teacher được quyền | Must |
| FR-07 | Quản lý môn học | Admin/Manager | Must |
| FR-08 | Quản lý năm học, học kỳ | Admin/Manager | Must |
| FR-09 | Quản lý tham số hệ thống | Admin/Manager | Must |
| FR-10 | Nhập bảng điểm môn học | Teacher | Must |
| FR-11 | Tính điểm trung bình môn | System | Must |
| FR-12 | Tra cứu điểm | Teacher, Student | Must |
| FR-13 | Báo cáo tổng kết môn | Admin/Manager | Should |
| FR-14 | Báo cáo tổng kết học kỳ | Admin/Manager | Should |
| FR-15 | Quản lý người dùng | Admin/Manager | Should |
| FR-16 | Phân công giáo viên | Admin/Manager | Could |
| FR-17 | Ghi log thao tác quan trọng | System | Could |

## 5. Yêu cầu phi chức năng

| Mã | Tên yêu cầu | Mô tả |
|---|---|---|
| NFR-01 | Bảo mật | Người dùng phải đăng nhập trước khi sử dụng chức năng nghiệp vụ |
| NFR-02 | Phân quyền | Chức năng phải giới hạn theo vai trò |
| NFR-03 | Toàn vẹn dữ liệu | Không cho tạo dữ liệu mâu thuẫn: điểm ngoài khoảng, lớp vượt sĩ số, học sinh trùng lớp |
| NFR-04 | Hiệu năng | Các thao tác tra cứu/lưu dữ liệu MVP phản hồi đủ nhanh để demo |
| NFR-05 | Dễ sử dụng | Giao diện rõ ràng, thông báo lỗi dễ hiểu |
| NFR-06 | Dễ bảo trì | Backend chia module theo domain; frontend chia page/service/component |
| NFR-07 | Khả năng tiến hóa | Tham số như tuổi, sĩ số, điểm đạt không mã hóa cứng |
| NFR-08 | Truy vết | Nên ghi log đăng nhập, đổi tham số, sửa điểm, phân quyền |

## 6. Ràng buộc kỹ thuật

- Backend: NestJS, TypeScript, Prisma ORM.
- Database: PostgreSQL.
- Frontend: React, Vite, TypeScript.
- Auth: JWT.
- API docs: Swagger hoặc file `api-spec.md`.

## 7. Luồng demo mục tiêu

1. Admin đăng nhập.
2. Admin kiểm tra tham số năm học.
3. Admin thêm học sinh mới.
4. Admin thêm học sinh vào lớp 10A1.
5. Teacher đăng nhập.
6. Teacher nhập điểm môn Toán cho lớp 10A1.
7. Student đăng nhập.
8. Student tra cứu điểm cá nhân.
9. Admin xem báo cáo tổng kết môn/học kỳ.
