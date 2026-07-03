# Use Cases — Hệ thống Quản lý học sinh SE104

Tài liệu này mô tả các use case đã implement trong hệ thống, bám theo code hiện tại và scope đồ án SE104.

## Quy ước

- **Actor chính** là người khởi tạo use case.
- Role đúng theo hệ thống: `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`, `STUDENT`.
- GVCN/GVBM là vai trò theo `TeacherAssignment`, không phải role đăng nhập riêng.

---

## UC-01. Đăng nhập

- **Actor:** Tất cả người dùng
- **Mục tiêu:** Xác thực tài khoản và nhận JWT để gọi API.
- **Luồng chính:**
  1. Người dùng nhập username và password.
  2. Backend kiểm tra tài khoản: `User.status = ACTIVE`.
  3. Backend so sánh password bằng bcrypt.
  4. Backend tạo JWT (8 giờ).
  5. Backend trả `accessToken` và thông tin user (id, role, teacherId/studentId).
- **Ngoại lệ:** Sai tài khoản/mật khẩu → 401. Tài khoản bị khóa → 403.
- **API:** `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`

---

## UC-02. Quản lý tài khoản người dùng

- **Actor:** `ADMIN`
- **Mục tiêu:** Tạo, xem, cập nhật, khóa tài khoản; đặt lại mật khẩu.
- **Luồng chính:**
  1. Admin xem danh sách tài khoản (lọc theo role, status, từ khóa).
  2. Admin tạo tài khoản mới (liên kết Teacher hoặc Student nếu cần).
  3. Admin cập nhật thông tin hoặc đổi status (ACTIVE/LOCKED).
  4. Admin đặt lại mật khẩu.
- **API:** `GET/POST /users`, `GET/PATCH /users/:id`, `POST /users/:id/reset-password`

---

## UC-03. Quản lý học sinh

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Tiếp nhận học sinh mới, cập nhật hồ sơ, tra cứu.
- **Luồng chính:**
  1. Giáo vụ mở danh sách học sinh (lọc theo trạng thái, lớp, từ khóa).
  2. Giáo vụ thêm học sinh mới: họ tên, ngày sinh, giới tính, mã học sinh, ngày tiếp nhận.
  3. Backend kiểm tra tuổi theo `SystemParameter`; mã học sinh không trùng.
  4. Học sinh mới có `status = PENDING_CLASS_ASSIGNMENT`.
  5. Giáo vụ cập nhật hồ sơ khi cần.
- **Ngoại lệ:** Tuổi ngoài phạm vi; mã học sinh trùng.
- **API:** `GET/POST /students`, `GET/PATCH /students/:id`, `DELETE /students/:id`

---

## UC-04. Import học sinh từ Excel

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Nhập nhiều học sinh cùng lúc qua file Excel.
- **Luồng chính:**
  1. Giáo vụ tải file mẫu Excel (`GET /templates/students`).
  2. Điền thông tin học sinh vào file.
  3. Upload file (`POST /students/import/preview`) — hệ thống trả preview: hàng hợp lệ (xanh) và hàng lỗi (đỏ + lý do).
  4. Giáo vụ xác nhận import (`POST /students/import/commit`).
  5. Học sinh được tạo với `status = PENDING_CLASS_ASSIGNMENT`.
- **Ngoại lệ:** Mã học sinh đã tồn tại; tuổi không hợp lệ; thiếu trường bắt buộc.

---

## UC-05. Phân lớp và chuyển lớp

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Đưa học sinh vào lớp hoặc chuyển sang lớp khác.
- **Phân lớp:**
  1. Giáo vụ chọn học sinh `PENDING_CLASS_ASSIGNMENT`, chọn lớp và học kỳ.
  2. Backend kiểm tra sĩ số, enrollment unique.
  3. Ghi `StudentClassEnrollment` mới; cập nhật `currentSize`.
- **Chuyển lớp:**
  1. Giáo vụ chọn học sinh, lớp nguồn, lớp đích, học kỳ.
  2. Backend kiểm tra sĩ số lớp đích; chỉ cho phép cùng khối.
  3. Transaction: enrollment cũ → `TRANSFERRED`; enrollment mới → `ACTIVE`; cập nhật `currentSize` hai lớp.
- **API:** `POST /enrollments/assign`, `POST /enrollments/transfer`, `GET /enrollments`, `GET /students/:id/enrollments`

---

## UC-06. Quản lý lớp học

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Tạo và cập nhật lớp theo năm học và khối lớp.
- **Luồng chính:**
  1. Giáo vụ chọn năm học, khối lớp.
  2. Tạo lớp: tên lớp unique trong năm học, sĩ số tối đa.
  3. Có thể gán GVCN ngay hoặc gán sau qua `teacher-assignments`.
- **API:** `GET/POST /classes`, `GET/PATCH /classes/:id`, `GET /classes/:id/students`

---

## UC-07. Quản lý Năm học & Học kỳ

- **Actor:** `ACADEMIC_STAFF`, `ADMIN`
- **Mục tiêu:** Tạo và cập nhật năm học, học kỳ qua giao diện; quản lý khối lớp và môn học.
- **Luồng Năm học:**
  1. Giáo vụ/Admin vào trang **Năm học** → xem danh sách kèm số học kỳ, số lớp.
  2. Tạo năm học mới: tên, startYear, endYear, startDate, endDate, isActive.
  3. Nếu `isActive = true`: hệ thống tự động set tất cả năm học khác thành `isActive = false` (trong transaction).
  4. Cập nhật năm học: sửa tên, ngày, trạng thái.
- **Luồng Học kỳ:**
  1. Giáo vụ vào trang **Học kỳ** → lọc theo năm học.
  2. Tạo học kỳ: tên (HK1/HK2), schoolYearId, startDate, endDate, isActive.
  3. Nếu `isActive = true`: chỉ tắt học kỳ khác **trong cùng năm học** (không ảnh hưởng năm khác).
- **Ngoại lệ:** `startYear >= endYear`; `startDate >= endDate`; tên năm học/học kỳ trùng.
- **API:** `GET/POST/PATCH /academic-years`, `GET/POST/PATCH /semesters`
- **Frontend:** `/academic-years`, `/semesters` (ADMIN + ACADEMIC_STAFF)

---

## UC-08. Quản lý tham số hệ thống

- **Actor:** `ACADEMIC_STAFF`, `ADMIN`
- **Mục tiêu:** Cập nhật quy định tuổi, sĩ số, thang điểm, điểm đạt theo năm học.
- **API:** `GET /system-parameters`, `PATCH /system-parameters/:id`

---

## UC-09. Phân công giáo viên

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Gán GVCN cho lớp theo năm học; gán GVBM cho lớp/môn/học kỳ.
- **Luồng GVCN:**
  1. Giáo vụ chọn giáo viên, lớp, năm học; `assignmentType = HOMEROOM`.
  2. Backend kiểm tra: lớp chưa có GVCN active trong năm học đó.
- **Luồng GVBM:**
  1. Giáo vụ chọn giáo viên, lớp, môn, học kỳ; `assignmentType = SUBJECT`.
  2. Backend kiểm tra: lớp/môn/HK chưa có GVBM chính.
- **API:** `GET/POST /teacher-assignments`, `GET/PATCH /teacher-assignments/:id`, `GET /teachers/:id/assignments`, `GET /me/teacher-assignments`

---

## UC-10. Nhập bảng điểm môn học

- **Actor:** `TEACHER` (có SUBJECT assignment)
- **Mục tiêu:** GVBM nhập điểm thành phần cho học sinh theo lớp/môn/học kỳ.
- **Luồng chính:**
  1. GVBM xem danh sách bảng điểm của mình (`GET /scores/sheets`).
  2. GVBM mở bảng điểm (`GET /scores/sheets/:id`) hoặc tạo mới (`POST /scores/sheets`).
  3. Với từng học sinh, nhập 4 loại điểm: ORAL_15M, ONE_PERIOD, MIDTERM, FINAL (`PUT /scores/sheets/:id/students/:studentId`).
  4. Backend tính điểm trung bình môn và lưu.
  5. Sau khi nhập đủ, GVBM nộp bảng điểm (`POST /scores/sheets/:id/submit`) → `SUBMITTED`.
- **Ngoại lệ:** Điểm ngoài khoảng; học sinh không thuộc lớp; bảng điểm đã LOCKED.
- **API:** `GET/POST /scores/sheets`, `GET /scores/sheets/:id`, `PUT /scores/sheets/:id/students/:studentId`, `POST /scores/sheets/:id/submit`

---

## UC-11. Import điểm từ Excel

- **Actor:** `TEACHER`, `ACADEMIC_STAFF`
- **Mục tiêu:** Nhập điểm cả lớp qua file Excel thay vì nhập tay từng học sinh.
- **Luồng chính:**
  1. Tải file mẫu (`GET /templates/score-sheet?sheetId=`).
  2. Điền điểm vào file.
  3. Preview (`POST /scores/sheets/:id/import/preview`) — hệ thống hiển thị hàng hợp lệ/lỗi.
  4. Commit (`POST /scores/sheets/:id/import/commit`).

---

## UC-12. Khóa bảng điểm

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Giáo vụ xem lại và khóa bảng điểm đã nộp.
- **Luồng chính:**
  1. Giáo vụ xem danh sách bảng điểm `SUBMITTED`.
  2. Kiểm tra điểm từng học sinh.
  3. Khóa bảng điểm (`POST /scores/sheets/:id/lock`) → `LOCKED`.
- **Ngoại lệ:** Bảng điểm chưa `SUBMITTED`; thiếu điểm bắt buộc.
- **Kết quả:** GVBM không sửa trực tiếp được nữa. Báo cáo chính thức dùng bảng điểm này.

---

## UC-13. Yêu cầu sửa điểm

- **Actor tạo:** `TEACHER` (có SUBJECT assignment đúng lớp/môn/HK)
- **Actor duyệt:** `ACADEMIC_STAFF`
- **Mục tiêu:** Sửa điểm sau khi bảng điểm đã LOCKED thông qua quy trình duyệt.
- **Luồng chính:**
  1. GVBM mở bảng điểm LOCKED, tìm học sinh cần sửa.
  2. GVBM tạo yêu cầu: điểm cũ, điểm mới, lý do (`POST /score-change-requests`).
  3. Yêu cầu ở trạng thái `PENDING`.
  4. Giáo vụ xem danh sách yêu cầu PENDING.
  5. Giáo vụ duyệt (`approve`) hoặc từ chối (`reject`) kèm ghi chú.
  6. Nếu duyệt: điểm được cập nhật, điểm trung bình tính lại (trong transaction).
- **Ngoại lệ:** Tạo trùng yêu cầu PENDING cho cùng học sinh/loại điểm.
- **API:** `GET/POST /score-change-requests`, `GET /score-change-requests/:id`, `POST /score-change-requests/:id/approve`, `POST /score-change-requests/:id/reject`

---

## UC-14. Tra cứu điểm

- **Actor:** `TEACHER` (theo scope), `STUDENT` (cá nhân), `ACADEMIC_STAFF`, `MANAGER`
- **Mục tiêu:** Xem điểm theo lớp/môn/học kỳ hoặc cá nhân.
- **Luồng STUDENT:**
  1. Học sinh vào "Điểm của tôi" (`GET /scores/my-scores`).
  2. Hệ thống trả điểm tất cả môn học kỳ của học sinh đó (dựa trên JWT).
- **Luồng GVCN:**
  1. GVCN xem tất cả bảng điểm lớp chủ nhiệm (`GET /scores/sheets?classId=`).
- **Luồng GVBM:**
  1. GVBM xem bảng điểm đúng lớp/môn/HK được phân công.
- **API:** `GET /scores/sheets`, `GET /scores/sheets/:id`, `GET /scores/my-scores`

---

## UC-15. Xuất PDF bảng điểm

- **Actor:** `TEACHER`, `ACADEMIC_STAFF`, `STUDENT`
- **Mục tiêu:** Tải file PDF bảng điểm lớp hoặc phiếu kết quả cá nhân.
- **Luồng:**
  1. Mở bảng điểm → nhấn "Tải PDF" → trình duyệt tải file.
  2. Hoặc từ "Điểm của tôi" → nhấn "PDF HK" → tải phiếu cá nhân.
- **API:** `GET /scores/sheets/:id/pdf`, `GET /reports/student-transcript/:studentId/pdf`

---

## UC-16. Báo cáo học vụ

- **Actor:** `ACADEMIC_STAFF`, `MANAGER`, `TEACHER` (theo scope)
- **Mục tiêu:** Xem báo cáo tổng kết môn, học kỳ, dashboard.
- **Luồng:**
  1. Người dùng chọn bộ lọc (lớp, môn, học kỳ).
  2. Hệ thống tổng hợp và trả báo cáo.
- **Kết quả:** Sĩ số, điểm TB, số đạt, tỷ lệ đạt, danh sách học sinh.
- **API:** `GET /reports/class-semester`, `GET /reports/subject-summary`, `GET /reports/student-semester/:studentId`, `GET /reports/dashboard-summary`

---

## UC-17. Chốt kết quả học kỳ

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Tính điểm TB học kỳ, phân loại học lực, lưu kết quả chính thức.
- **Điều kiện trước:** Toàn bộ bảng điểm bắt buộc đã `LOCKED`.
- **Luồng:**
  1. Giáo vụ vào "Chốt điểm học kỳ", chọn học kỳ.
  2. Hệ thống tính `semesterAverage`, `academicRating` cho từng học sinh.
  3. Ghi vào `SemesterStudentResult`.
- **API:** `POST /semesters/:id/finalize`, `GET /semesters/:id/results`

---

## UC-18. Tổng kết năm học và xét lên lớp

- **Actor:** `ACADEMIC_STAFF`
- **Mục tiêu:** Tính điểm TB năm, xét lên lớp/thi lại/ở lại.
- **Điều kiện trước:** Cả HK1 và HK2 đã chốt kết quả.
- **Luồng:**
  1. Giáo vụ vào "Tổng kết năm học", chọn năm học.
  2. Hệ thống tính `yearAverage = (hk1 × 1 + hk2 × 2) / 3`.
  3. Xét quyết định: ADVANCE / REMEDIAL / CONDUCT_REVIEW / RETAIN.
  4. Ghi vào `YearEndResult`.
- **API:** `POST /school-years/:id/year-end`, `GET /reports/year-end`

---

## UC-19. Đánh giá hạnh kiểm (UC1)

- **Actor tạo/nộp:** `TEACHER` (GVCN lớp chủ nhiệm)
- **Actor chốt:** `ACADEMIC_STAFF`
- **Mục tiêu:** Đánh giá hạnh kiểm học sinh theo 4 tiêu chí mỗi học kỳ.
- **Luồng:**
  1. GVCN tạo hạnh kiểm cho cả lớp (`POST /conduct-assessments/batch`).
  2. GVCN chỉnh sửa tiêu chí từng học sinh (`PATCH /conduct-assessments/:id`).
  3. GVCN nộp (`POST /conduct-assessments/:id/submit`) → `SUBMITTED`.
  4. Giáo vụ xem danh sách SUBMITTED, chốt kèm xếp loại (`POST /conduct-assessments/:id/finalize`) → `FINALIZED`.
- **API:** `GET/POST /conduct-assessments`, `POST /conduct-assessments/batch`, `PATCH /conduct-assessments/:id`, `POST /conduct-assessments/:id/submit`, `POST /conduct-assessments/:id/finalize`

---

## UC-20. Thời khóa biểu (UC5)

- **Actor tạo:** `ACADEMIC_STAFF`
- **Actor xem:** Tất cả role; `TEACHER` và `STUDENT` xem TKB cá nhân.
- **Mục tiêu:** Lập và xem thời khóa biểu theo lớp/học kỳ.
- **Luồng:**
  1. Giáo vụ chọn lớp, học kỳ; nhấn vào ô trống trong grid.
  2. Chọn môn, giáo viên, phòng học; lưu.
  3. Backend kiểm tra ràng buộc trùng lịch (lớp và giáo viên).
  4. Học sinh/giáo viên xem TKB cá nhân.
- **API:** `GET /timetable`, `GET /timetable/my`, `POST /timetable`, `POST /timetable/bulk`, `DELETE /timetable/:id`

---

## UC-21. Nhật ký hệ thống (UC6)

- **Actor:** `ADMIN`, `ACADEMIC_STAFF`
- **Mục tiêu:** Tra cứu lịch sử thao tác quan trọng trong hệ thống.
- **Luồng:**
  1. Admin/Giáo vụ vào "Nhật ký hệ thống".
  2. Lọc theo loại đối tượng, hành động, khoảng ngày.
  3. Xem mô tả ngôn ngữ tự nhiên của từng thao tác.
- **API:** `GET /audit-logs`

---

## UC-22. Hệ thống Thông báo

- **Actor tạo:** `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`
- **Actor xem:** Tất cả 5 roles
- **Actor xoá:** `ADMIN`, `ACADEMIC_STAFF`
- **Mục tiêu:** Gửi thông báo nội bộ theo phạm vi (toàn trường / theo role / theo lớp).
- **Luồng xem:**
  1. Người dùng thấy biểu tượng chuông trên header với badge số thông báo chưa đọc.
  2. Nhấn chuông hoặc vào menu **Thông báo** → xem danh sách.
  3. Nhấn vào thông báo → đánh dấu đã đọc → badge giảm.
  4. Lọc "Chưa đọc" để xem thông báo còn mới.
- **Luồng tạo (ACADEMIC_STAFF / MANAGER):**
  1. Nhấn **Tạo thông báo** → điền tiêu đề, nội dung.
  2. Chọn **Gửi đến**: Tất cả / Học sinh / Giáo viên / Giáo vụ / BGH / Admin.
  3. Gửi → thông báo xuất hiện ngay cho đối tượng nhận.
- **Luồng tạo (TEACHER) — có ràng buộc lớp:**
  1. Nhấn **Tạo thông báo** → form hiện dropdown **Gửi đến lớp** (không có targetRole).
  2. Dropdown chỉ liệt kê lớp giáo viên đó được phân công (HOMEROOM hoặc SUBJECT).
  3. Backend kiểm tra `TeacherAssignment` — từ chối nếu classId không hợp lệ.
  4. Thông báo chỉ gửi đến học sinh (`targetRole = 'STUDENT'`) của lớp đã chọn.
- **Quy tắc hiển thị:**
  - `classId = null && targetRole = null` → tất cả thấy.
  - `classId = null && targetRole = X` → chỉ role X thấy.
  - `classId = N && targetRole = 'STUDENT'` → học sinh đang học lớp N thấy.
  - TEACHER thấy thêm thông báo của tất cả lớp mình phụ trách.
- **Ngoại lệ:** TEACHER gửi đến lớp không được phân công → `403 ForbiddenException`.
- **API:** `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications`, `POST /notifications/:id/read`, `GET /notifications/manage`, `DELETE /notifications/:id`, `GET /notifications/teacher-classes`
- **Frontend:** `/notifications` (tất cả roles); bell icon + badge trên header
