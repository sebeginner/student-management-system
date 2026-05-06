# Use Cases - Hệ thống Quản lý học sinh

## 1. Quy ước

Mỗi use case gồm: mã, tên, actor chính, mục tiêu, điều kiện trước, luồng chính, ngoại lệ và kết quả sau.

## UC-01. Đăng nhập

- Actor chính: Admin, Teacher, Student
- Mục tiêu: Xác thực người dùng và điều hướng theo vai trò.
- Điều kiện trước: Người dùng có tài khoản hợp lệ.
- Luồng chính:
  1. Người dùng nhập username và password.
  2. Hệ thống kiểm tra tài khoản.
  3. Hệ thống kiểm tra mật khẩu bằng bcrypt.
  4. Hệ thống tạo JWT.
  5. Hệ thống trả thông tin user và role.
- Ngoại lệ:
  - Sai tài khoản/mật khẩu: trả 401.
  - Tài khoản bị khóa: trả 403 hoặc 400 tùy thiết kế.
- Kết quả sau: Người dùng có token để gọi API.

## UC-02. Xem thông tin tài khoản hiện tại

- Actor chính: Admin, Teacher, Student
- Mục tiêu: Lấy thông tin người dùng đang đăng nhập.
- Điều kiện trước: Có JWT hợp lệ.
- Luồng chính:
  1. Frontend gửi token.
  2. Backend giải mã token.
  3. Backend trả thông tin user, role và liên kết student/teacher nếu có.
- Kết quả sau: Frontend biết người dùng thuộc vai trò nào.

## UC-03. Quản lý học sinh

- Actor chính: Admin/Manager
- Mục tiêu: Thêm, sửa, xem danh sách học sinh.
- Điều kiện trước: Người dùng có quyền quản lý học sinh.
- Luồng chính:
  1. Người dùng mở màn hình học sinh.
  2. Hệ thống hiển thị danh sách học sinh.
  3. Người dùng nhập thông tin học sinh mới.
  4. Hệ thống kiểm tra họ tên, ngày sinh, email.
  5. Hệ thống kiểm tra tuổi theo tham số.
  6. Hệ thống lưu hồ sơ học sinh.
- Ngoại lệ:
  - Tuổi không hợp lệ.
  - Email sai định dạng.
  - Mã học sinh trùng.
- Kết quả sau: Hồ sơ học sinh được lưu.

## UC-04. Tra cứu học sinh

- Actor chính: Admin/Manager, Teacher
- Mục tiêu: Tìm học sinh theo mã, tên, lớp hoặc trạng thái.
- Luồng chính:
  1. Người dùng nhập từ khóa hoặc bộ lọc.
  2. Hệ thống truy vấn dữ liệu.
  3. Hệ thống trả danh sách kết quả.
  4. Người dùng chọn một học sinh để xem chi tiết.

## UC-05. Quản lý lớp học

- Actor chính: Admin/Manager
- Mục tiêu: Tạo và cập nhật lớp học theo năm học/khối lớp.
- Luồng chính:
  1. Người dùng chọn năm học và khối lớp.
  2. Người dùng tạo lớp mới.
  3. Hệ thống kiểm tra tên lớp không trùng trong cùng năm học.
  4. Hệ thống lưu lớp.

## UC-06. Phân học sinh vào lớp

- Actor chính: Admin/Manager, Teacher được phân quyền
- Mục tiêu: Đưa học sinh vào lớp theo học kỳ.
- Luồng chính:
  1. Người dùng chọn lớp và học kỳ.
  2. Hệ thống hiển thị danh sách học sinh trong lớp.
  3. Người dùng chọn học sinh cần thêm.
  4. Hệ thống kiểm tra sĩ số tối đa.
  5. Hệ thống kiểm tra học sinh chưa có lớp trong học kỳ đó.
  6. Hệ thống lưu phân lớp.
- Ngoại lệ:
  - Lớp đã đủ sĩ số.
  - Học sinh đã có lớp trong học kỳ.

## UC-07. Quản lý dữ liệu nền

- Actor chính: Admin/Manager
- Mục tiêu: Quản lý năm học, học kỳ, khối lớp, môn học, loại kiểm tra.
- Luồng chính:
  1. Người dùng mở màn hình dữ liệu nền.
  2. Người dùng thêm/sửa/ngừng áp dụng danh mục.
  3. Hệ thống kiểm tra trùng mã/tên.
  4. Hệ thống lưu thay đổi.

## UC-08. Quản lý tham số hệ thống

- Actor chính: Admin/Manager
- Mục tiêu: Cập nhật tuổi, sĩ số, điểm, điểm đạt theo năm học.
- Luồng chính:
  1. Người dùng chọn năm học.
  2. Hệ thống tải tham số hiện hành.
  3. Người dùng cập nhật giá trị.
  4. Hệ thống validate miền giá trị.
  5. Hệ thống lưu tham số mới.

## UC-09. Nhập bảng điểm môn học

- Actor chính: Teacher
- Mục tiêu: Nhập điểm cho học sinh theo lớp, môn, học kỳ.
- Luồng chính:
  1. Giáo viên chọn lớp, môn, học kỳ.
  2. Hệ thống tải danh sách học sinh trong lớp.
  3. Giáo viên nhập điểm thành phần.
  4. Hệ thống kiểm tra điểm 0-10.
  5. Hệ thống tính điểm trung bình môn.
  6. Hệ thống lưu bảng điểm.
- Ngoại lệ:
  - Điểm ngoài khoảng.
  - Bảng điểm đã khóa.

## UC-10. Chỉnh sửa điểm

- Actor chính: Teacher/Admin được quyền
- Mục tiêu: Sửa điểm đã nhập khi có sai sót.
- Luồng chính:
  1. Người dùng mở bảng điểm.
  2. Người dùng sửa điểm.
  3. Hệ thống kiểm tra quyền và trạng thái bảng điểm.
  4. Hệ thống tính lại điểm trung bình.
  5. Hệ thống lưu thay đổi.

## UC-11. Tra cứu điểm cá nhân

- Actor chính: Student
- Mục tiêu: Học sinh xem điểm của mình theo học kỳ.
- Luồng chính:
  1. Học sinh chọn học kỳ.
  2. Hệ thống lấy điểm các môn của học sinh.
  3. Hệ thống hiển thị điểm thành phần và điểm trung bình.

## UC-12. Tra cứu điểm theo lớp

- Actor chính: Teacher, Admin/Manager
- Mục tiêu: Xem điểm của một lớp theo môn/học kỳ.
- Luồng chính:
  1. Người dùng chọn lớp, môn, học kỳ.
  2. Hệ thống trả bảng điểm tương ứng.

## UC-13. Báo cáo tổng kết môn

- Actor chính: Admin/Manager
- Mục tiêu: Tính số lượng đạt và tỉ lệ đạt theo từng lớp cho một môn.
- Luồng chính:
  1. Người dùng chọn môn, học kỳ.
  2. Hệ thống lấy điểm trung bình môn.
  3. Hệ thống so sánh với điểm đạt môn.
  4. Hệ thống tính số lượng đạt và tỉ lệ đạt.

## UC-14. Báo cáo tổng kết học kỳ

- Actor chính: Admin/Manager
- Mục tiêu: Tính số lượng học sinh đạt học kỳ theo lớp.
- Luồng chính:
  1. Người dùng chọn học kỳ.
  2. Hệ thống lấy điểm trung bình học kỳ.
  3. Hệ thống so sánh với điểm đạt học kỳ.
  4. Hệ thống tính số lượng đạt và tỉ lệ đạt.

## UC-15. Quản lý người dùng

- Actor chính: Admin/Manager
- Mục tiêu: Tạo, sửa, khóa tài khoản.
- Luồng chính:
  1. Người dùng mở danh sách user.
  2. Người dùng tạo hoặc cập nhật user.
  3. Hệ thống kiểm tra username/email không trùng.
  4. Hệ thống lưu tài khoản.

## UC-16. Quản lý phân quyền

- Actor chính: Admin/Manager
- Mục tiêu: Gán role và permission cho người dùng.
- MVP: chỉ cần 3 role chính: ADMIN, TEACHER, STUDENT.

## UC-17. Phân công giáo viên

- Actor chính: Admin/Manager
- Mục tiêu: Gán giáo viên cho lớp/môn/học kỳ.
- MVP: có thể để mức đơn giản hoặc làm sau.

## UC-18. Ghi log thao tác

- Actor chính: System
- Mục tiêu: Lưu thao tác quan trọng để truy vết.
- MVP: ưu tiên log đăng nhập, sửa điểm, đổi tham số, đổi quyền.
