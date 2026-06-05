# Script Demo Cuối Kỳ — Student Management System SE104

Tài liệu này dùng để nhóm thuyết trình demo. Bám theo dữ liệu seed thực tế (năm học 2025-2026, HK2 đang active).

---

## 1. Chuẩn bị trước demo

**Chạy hệ thống:**

```bat
start-demo.bat
```

Hoặc mở 2 terminal:

```bash
cd backend && npm run start
```

```bash
cd frontend && npm run dev -- --host 127.0.0.1 --port 5173
```

**Reset dữ liệu về trạng thái ban đầu (nếu cần):**

```bash
cd backend
npx prisma migrate reset --force
npm run prisma:seed
```

**Kiểm tra nhanh:**

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

**URL:**

| Dịch vụ | URL |
|---|---|
| Frontend | http://127.0.0.1:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api |

---

## 2. Tài khoản demo

| Vai trò | Username | Password | Họ tên | Phân công chính |
|---|---|---|---|---|
| Admin | `admin` | `Admin@123` | Quản trị viên | Quản lý tài khoản, role, tham số |
| Giáo vụ | `giaovu01` | `Staff@123` | Giáo vụ Hoài | Toàn quyền nghiệp vụ học vụ |
| Ban giám hiệu | `manager01` | `Manager@123` | Phó Hiệu trưởng | Chỉ xem báo cáo |
| GVCN 10A1 + GVBM Toán | `teacher01` | `Teacher@123` | Nguyễn Tuấn An | Toán 10A1, 10A2 |
| GVCN 10A2 + GVBM Văn | `teacher02` | `Teacher@123` | Trần Thị Bích Ngọc | Văn 10A1, 10A2 |
| GVCN 11A1 + GVBM Anh | `teacher03` | `Teacher@123` | Lê Văn Cường | Anh 10A1, 11A1 |
| GVCN 12A1 + GVBM Vật lý | `teacher04` | `Teacher@123` | Phạm Thị Duyên | Vật lý 10A1, 11A1, 12A1 |
| GVBM Hóa học | `teacher05` | `Teacher@123` | Hoàng Minh Đức | Hóa 10A1, 10A2 |
| Học sinh lớp 10A1 | `student01` | `Student@123` | Nguyễn Văn An | |

> **Lưu ý khi thuyết trình:** GVCN và GVBM không phải 2 loại tài khoản — cả 5 giáo viên đều dùng role `TEACHER`. Vai trò GVCN/GVBM được xác định qua bảng `TeacherAssignment` với `assignmentType = HOMEROOM` hoặc `SUBJECT`.

---

## 3. Luồng demo chính

### Bước 1 — Admin quản lý tài khoản

1. Đăng nhập `admin / Admin@123`.
2. **Quản lý người dùng** → danh sách tất cả tài khoản.
   - Lọc theo vai trò "Giáo viên" → thấy 5 giáo viên.
   - Lọc theo "Học sinh" → thấy 7 học sinh có tài khoản.
3. **Thêm người dùng** → tạo tài khoản mới (demo điền form).
4. **Vai trò** → xem ma trận quyền hạn.
5. **Quy định / Tham số** → xem cấu hình năm học 2025-2026: tuổi 15-20, sĩ số 40, thang 0-10, đạt 5.0.

*Điểm thuyết trình:* Admin là quản trị kỹ thuật, không phải actor nghiệp vụ học vụ hằng ngày.

---

### Bước 2 — Giáo vụ xem tổng quan và quản lý học sinh

1. Đăng nhập `giaovu01 / Staff@123`.
2. **Dashboard** → thống kê: ~73 học sinh, 5 lớp, bảng điểm đã/chưa khóa, yêu cầu chờ.
3. **Quản lý học sinh** → lọc "Chờ phân lớp" → thấy 3 học sinh (S006, S601, S602).
4. **Phân lớp** → chọn HK2 → chọn S601 (Nguyễn Thị Tuyết) → phân vào 10A1.
   - Thấy sĩ số 10A1 tăng lên 21.

*Điểm thuyết trình:* Giáo vụ là actor trung tâm, toàn quyền nghiệp vụ học vụ.

---

### Bước 3 — Giáo vụ xem và phân công giáo viên

1. **Phân công giáo viên** → tìm lớp 11A2 (chưa có GVCN).
2. Thêm phân công HOMEROOM cho teacher03 (Lê Văn Cường) vào 11A2.
3. Xác nhận `teacher01` là GVCN 10A1 + GVBM Toán 10A1 + 10A2 cả HK1 và HK2.

*Điểm thuyết trình:* Một giáo viên có thể vừa là GVCN vừa là GVBM nhiều lớp.

---

### Bước 4 — Giáo vụ demo điểm số

1. **Tra cứu điểm** → tìm bảng điểm "Vật lý / 10A1 / HK1" (trạng thái **SUBMITTED**).
2. Nhấn **Xem** → trang chi tiết hiển thị đầy đủ điểm 20 học sinh.
3. Nhấn **Khóa bảng điểm** → bảng điểm chuyển sang **LOCKED**.

*Điểm thuyết trình:* Chỉ Giáo vụ được khóa bảng điểm. Sau khi khóa, GVBM không sửa trực tiếp.

---

### Bước 5 — Giáo vụ duyệt yêu cầu sửa điểm

1. **Yêu cầu sửa điểm** → thấy 1 yêu cầu PENDING từ `teacher01` (Toán/HK1/S003 — điểm Giữa kỳ).
2. Mở chi tiết → xem điểm cũ / mới / lý do.
3. Nhấn **Duyệt** → thêm ghi chú → xác nhận.
4. Yêu cầu chuyển sang **APPROVED**; điểm S003 được cập nhật.

*Điểm thuyết trình:* Quy trình yêu cầu sửa điểm đảm bảo có audit trail đầy đủ.

---

### Bước 6 — Teacher01: xem phân công, nhập điểm, gửi yêu cầu sửa điểm

1. Đăng nhập `teacher01 / Teacher@123`.
2. **Phân công của tôi**:
   - 1 GVCN: 10A1 (2025-2026).
   - 4 GVBM: Toán 10A1 (HK1+HK2), Toán 10A2 (HK1+HK2).
3. **Nhập bảng điểm** → chọn "Toán / 10A1 / HK2" (DRAFT — 10/20 hs đã có điểm).
   - Nhập điểm cho học sinh còn thiếu (ORAL_15M, ONE_PERIOD, MIDTERM, FINAL).
   - Điểm trung bình tự tính theo công thức.
4. **Đặc quyền GVCN** → tra cứu điểm lọc "Lớp 10A1, HK1" → thấy 5 bảng điểm (Toán, Văn, Anh, VL, Hóa).
   - Môn Toán: quyền GVBM (nhập được).
   - Môn Văn, Anh...: quyền GVCN (chỉ xem).
5. **Yêu cầu sửa điểm** → mở Toán/10A1/HK1 (LOCKED) → tìm học sinh S003 → tạo yêu cầu (PENDING).
6. Xem danh sách **Yêu cầu sửa điểm** → thấy yêu cầu đang chờ.

---

### Bước 7 — Teacher02: chứng minh phân quyền GVBM theo scope

**Ngữ cảnh:** Trần Thị Bích Ngọc — GVCN 10A2, dạy Văn 10A1 và 10A2.

1. Đăng nhập `teacher02 / Teacher@123`.
2. **Tra cứu điểm**:
   - Thấy: Văn/10A1/HK1 (GVBM), Văn/10A2/HK1 (GVBM).
   - Thấy thêm: Toán/10A2/HK1 (GVCN — chỉ xem).
   - **Không thấy** Toán/10A1 — vì không là GVCN 10A1 và không có GVBM Toán.
3. **Báo cáo môn** → chọn Ngữ văn / HK1 → so sánh kết quả 10A1 vs 10A2.

*Điểm thuyết trình:* Backend enforce scope theo TeacherAssignment, không chỉ dựa vào role.

---

### Bước 8 — Manager xem báo cáo toàn trường

1. Đăng nhập `manager01 / Manager@123`.
2. **Dashboard** → thống kê toàn trường.
3. **Báo cáo** → chọn HK1 → xem lớp 10A1: điểm TB, tỷ lệ đạt, bảng xếp hạng học sinh.
4. So sánh với lớp 10A2 (báo cáo môn Toán HK1).
5. **Quy định / Tham số** → xem cấu hình (không có nút sửa).
6. **Phân công giáo viên** → xem toàn bộ (chỉ xem, không có nút thêm/sửa).

---

### Bước 9 — Học sinh xem điểm cá nhân

1. Đăng nhập `student01 / Student@123`.
2. **Hồ sơ cá nhân** → thông tin tài khoản, hồ sơ học sinh, lớp hiện tại (10A1 / HK2 / 2025-2026).
3. **Điểm của tôi**:
   - HK1: Toán, Văn, Anh, Vật lý (LOCKED — điểm chính thức).
   - HK2: Toán, Văn (DRAFT — đang nhập).
   - Xem điểm thành phần, điểm TB, trạng thái Đạt/Chưa đạt.

*Điểm thuyết trình:* Student không nhập studentId — backend lấy từ JWT (`/scores/my-scores`).

---

### Bước 10 — Demo Thông báo và Năm học

#### UC7 — Quản lý Năm học & Học kỳ (giaovu01)

1. Đăng nhập `giaovu01` → sidebar chọn **Năm học**.
2. Thấy `2025-2026` đang active (badge xanh), hiển thị số học kỳ và số lớp.
3. Nhấn **Thêm năm học** → điền `2026-2027`, năm `2026`–`2027`, ngày `2026-09-01` đến `2027-05-30`.
4. Tích **Đặt làm năm học đang hoạt động** → cảnh báo vàng → Tạo → `2025-2026` tự chuyển inactive.
5. Sidebar chọn **Học kỳ** → lọc `2026-2027` → chưa có HK nào.
6. Thêm HK1 (`2026-09-01` đến `2027-01-15`, active) → thêm HK2 (không active) → danh sách hiện đúng.

*Điểm thuyết trình:* Chỉ một năm học active tại một thời điểm. Chỉ một HK active trong cùng một năm học.

#### UC8 — Hệ thống Thông báo

**8a. Giáo vụ gửi thông báo toàn trường:**
1. `giaovu01` → **Thông báo** → **Tạo thông báo**.
2. Tiêu đề: "Nghỉ lễ 30/4 – 1/5"; Gửi đến: "Tất cả (toàn trường)" → **Gửi**.
3. Thông báo xuất hiện ngay trong danh sách ✓

**8b. Giáo viên gửi thông báo lớp:**
1. Đăng nhập `teacher01` → **Thông báo** → **Tạo thông báo**.
2. Form hiện dropdown **Gửi đến lớp** (không có targetRole): `10A1 (GVCN)`, `10A2 (GVBM)`.
3. Nhập tiêu đề, nội dung → chọn `10A1 (GVCN)` → Gửi ✓
4. *Demo lỗi:* cố gửi đến lớp 11A1 (không được phân công) → backend trả 403.

**8c. Học sinh xem thông báo:**
1. Đăng nhập `student01` (lớp 10A1) → header: badge chuông **4** (4 thông báo seed + 1 vừa tạo = 5 hoặc hơn tùy seed).
2. Nhấn chuông → trang **Thông báo** → thấy thông báo nền xanh nhạt (chưa đọc).
3. Nhấn "Nghỉ lễ 30/4" → nền trắng, badge giảm.
4. Tab **Chưa đọc** → xác nhận số còn lại đúng.
5. *Kiểm tra scope:* `student07` (lớp 10A2) **không thấy** thông báo lớp 10A1 của teacher01.

---

### Bước 11 — Demo các use case mở rộng

#### UC1 — Hạnh kiểm (teacher01 → giaovu01)

1. `teacher01` → **Đánh giá hạnh kiểm** → HK1 + 10A1.
2. Thấy 3 bản SUBMITTED (S101–S103) chờ duyệt + 5 bản FINALIZED (S001–S005).
3. Nhấn **Chỉnh sửa** một HS → chấm 4 tiêu chí → **Nộp** → SUBMITTED.
4. `giaovu01` → **Duyệt hạnh kiểm** → thấy bản SUBMITTED → **Chốt** → FINALIZED.

#### UC2 — Chốt điểm học kỳ

1. `giaovu01` → **Chốt điểm học kỳ** → chọn 2025-2026 + HK1.
2. Nhấn **Chốt kết quả HK** (seed đã tạo sẵn SemesterStudentResult cho 10A1).
3. Xem bảng kết quả: màu xanh = Giỏi/Khá, vàng = Yếu, đỏ = Kém.

#### UC5 — Thời khóa biểu

1. `giaovu01` → **Thời khóa biểu** → chọn HK2 + lớp 10A1.
2. Thấy grid T2–T7 × Tiết 1–5 với 11 tiết đã điền sẵn.
3. Nhấn ô trống → chọn môn + GV + phòng → **Lưu**.
4. Thử đặt GV đang bận cùng tiết → thấy thông báo lỗi trùng lịch.
5. `student01` → **TKB của tôi** → xem lịch học lớp 10A1 HK2.

#### UC3 — Xuất PDF

1. `teacher01` → tra cứu điểm → mở Toán/10A1/HK1 → **Tải PDF** → file `bang-diem-X.pdf`.
2. `student01` → **Điểm của tôi** → **PDF HK1** → phiếu kết quả cá nhân.

#### UC4 — Import Excel

1. `giaovu01` → **Quản lý học sinh** → **Import Excel**.
2. Tải file mẫu → điền học sinh mới → upload → thấy preview hợp lệ/lỗi.
3. Xác nhận import → học sinh tạo với trạng thái "Chờ phân lớp".

#### UC6 — Nhật ký hệ thống

1. `admin` → **Nhật ký hệ thống** → thấy danh sách thao tác.
2. Lọc theo loại đối tượng "Bảng điểm" → xem lịch sử khóa/sửa điểm.

---

## 4. Luồng phân quyền cần demo rõ

### STUDENT không xem điểm học sinh khác

- Đăng nhập `student01`.
- Chỉ thấy menu và trang điểm cá nhân.
- API `/scores/my-scores` lấy studentId từ JWT, không nhận từ query.

### TEACHER02 không sửa điểm Toán

1. Đăng nhập `teacher02`.
2. Vào danh sách bảng điểm.
3. Thử sửa bảng Toán/10A1: backend trả `403 NOT_SUBJECT_TEACHER`.

### GVCN xem tất cả môn lớp chủ nhiệm nhưng không nhập

- `teacher01` thấy 5 bảng điểm 10A1.
- Với môn Văn: nút "Nhập điểm" bị ẩn / vô hiệu hóa.
- API sẽ trả 403 nếu cố nhập.

### Chỉ Giáo vụ khóa bảng điểm và duyệt SCR

- Đăng nhập `teacher01`: không thấy nút "Khóa" và không thể duyệt SCR.
- Đăng nhập `giaovu01`: có đầy đủ nút Khóa và Duyệt.

---

## 5. Luồng phân quyền thông báo cần demo rõ

### TEACHER không gửi thông báo đến lớp khác

- Đăng nhập `teacher02` (GVCN 10A2, dạy Văn 10A1+10A2).
- Vào **Thông báo** → **Tạo** → dropdown chỉ hiện: `10A1 (GVBM)`, `10A2 (GVCN)`.
- `teacher02` **không thấy** lớp 11A1, 12A1 trong dropdown ✓

### STUDENT chỉ thấy thông báo lớp mình

- `student01` (10A1): thấy thông báo toàn trường + lớp 10A1.
- `student07` (10A2): thấy thông báo toàn trường + lớp 10A2; **không thấy** thông báo lớp 10A1.

---

## 6. Câu hỏi thường gặp khi vấn đáp

**Q: Tại sao không tạo role GVCN và GVBM riêng?**  
A: Vì một giáo viên có thể vừa là GVCN vừa là GVBM nhiều lớp/môn khác nhau. Dùng `TeacherAssignment` linh hoạt hơn và tránh phải tạo nhiều tài khoản.

**Q: Điểm trung bình tính thế nào?**  
A: `(avgOral × 1 + avgOnePeriod × 2 + midterm × 3 + final × 3) / 9`, làm tròn 2 chữ số thập phân. Hệ số lưu trong `ScoreWeight` để có thể thay đổi theo năm học.

**Q: Khi duyệt yêu cầu sửa điểm, hệ thống làm gì?**  
A: Cập nhật `ScoreDetail.score` và tính lại `StudentSubjectScore.averageScore` trong một transaction. Yêu cầu lưu lại `oldScore`, `newScore`, `reason`, `reviewNote`, thời gian duyệt.

**Q: ScoreSheet `LOCKED` có thể unlock không?**  
A: Có endpoint `POST /scores/sheets/:id/unlock` nhưng chỉ dành cho trường hợp ngoại lệ. Workflow bình thường là dùng `score-change-requests`.

**Q: Seed data có thể chạy nhiều lần không?**  
A: Có, seed là idempotent — dùng `upsert` nên chạy nhiều lần không tạo bản trùng.

**Q: Giáo viên gửi thông báo đến lớp mình — backend kiểm tra thế nào?**  
A: Service kiểm tra `TeacherAssignment.findFirst({ where: { teacher: { user: { id: creatorId } }, classId, isActive: true } })`. Nếu không tìm thấy → `ForbiddenException`. Điều này đảm bảo giáo viên không thể bypass bằng cách truyền `classId` tùy ý.

**Q: Số badge chuông tính thế nào?**  
A: `unreadCount = tổng thông báo trong phạm vi user - số bản ghi NotificationRead của user đó`. Không dùng trường `isRead` trên Notification để tránh dữ liệu không nhất quán giữa nhiều người dùng.
