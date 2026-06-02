# Hướng dẫn Demo – Hệ thống Quản lý Học sinh SE104

## Khởi động

```powershell
# Cài dependencies (lần đầu)
cd backend  && npm install
cd ../frontend && npm install

# Nạp dữ liệu demo (reset toàn bộ về trạng thái ban đầu)
cd backend && npm run prisma:seed

# Chạy hệ thống
./start-demo.ps1
# Backend:  http://localhost:3000/api/v1
# Frontend: http://127.0.0.1:5173
```

---

## Tài khoản demo

| Vai trò | Username | Password | Ghi chú |
|---------|----------|----------|---------|
| Quản trị viên | `admin` | `Admin@123` | Quản lý người dùng, tham số |
| Giáo vụ | `giaovu01` | `Staff@123` | Toàn quyền nghiệp vụ |
| Ban giám hiệu | `manager01` | `Manager@123` | Chỉ xem báo cáo |
| GVCN 10A1 + dạy Toán | `teacher01` | `Teacher@123` | Nguyễn Tuấn An |
| GVCN 10A2 + dạy Văn | `teacher02` | `Teacher@123` | Trần Thị Bích Ngọc |
| GVCN 11A1 + dạy Anh | `teacher03` | `Teacher@123` | Lê Văn Cường |
| GVCN 12A1 + dạy Vật lý | `teacher04` | `Teacher@123` | Phạm Thị Duyên |
| GV Hóa học (không CN) | `teacher05` | `Teacher@123` | Hoàng Minh Đức |
| Học sinh lớp 10A1 | `student01`–`student05` | `Student@123` | Nguyễn Văn An, ... |
| Học sinh lớp 10A2 | `student07` | `Student@123` | Bùi Quốc Minh |
| Học sinh chờ phân lớp | `student06` | `Student@123` | Đỗ Ngọc Lan |

---

## Dữ liệu có sẵn

### Lớp học (năm học 2025–2026)
| Lớp | Khối | Sĩ số | Giáo viên chủ nhiệm |
|-----|------|-------|---------------------|
| 10A1 | 10 | 20 | Nguyễn Tuấn An (Toán) |
| 10A2 | 10 | 15 | Trần Thị Bích Ngọc (Văn) |
| 11A1 | 11 | 15 | Lê Văn Cường (Anh) |
| 11A2 | 11 | 12 | _Chưa phân công_ |
| 12A1 | 12 | 8  | Phạm Thị Duyên (Vật lý) |
| _Chờ phân lớp_ | – | 3 | S006, S601, S602 |

### Bảng điểm HK1 (đã kết thúc)
| Bảng điểm | Trạng thái | Ghi chú demo |
|-----------|-----------|--------------|
| Toán / 10A1 | **LOCKED** | Xem lịch sử, báo cáo |
| Ngữ văn / 10A1 | **LOCKED** | |
| Tiếng Anh / 10A1 | **LOCKED** | |
| Vật lý / 10A1 | **SUBMITTED** | Giáo vụ **khóa** trong demo |
| Hóa học / 10A1 | **DRAFT** | Mới nhập 12/20 học sinh |
| Toán / 10A2 | **LOCKED** | |
| Ngữ văn / 10A2 | **LOCKED** | |
| Tiếng Anh / 11A1 | **LOCKED** | |
| Vật lý / 11A1 | **SUBMITTED** | Giáo vụ khóa |
| Vật lý / 12A1 | **LOCKED** | |

### Bảng điểm HK2 (đang tiến hành)
| Bảng điểm | Trạng thái | Ghi chú demo |
|-----------|-----------|--------------|
| Toán / 10A1 | **DRAFT** | 10/20 học sinh đã nhập |
| Ngữ văn / 10A1 | **DRAFT** | 8/20 học sinh đã nhập |

### Yêu cầu sửa điểm
| # | Bảng điểm | Học sinh | Cột điểm | Trạng thái |
|---|-----------|----------|----------|-----------|
| 1 | Toán / 10A1 / HK1 | Lê Minh Châu (S003) | Giữa kỳ | **PENDING** – giáo vụ duyệt |
| 2 | Ngữ văn / 10A1 / HK1 | Nguyễn Văn An (S001) | Miệng | **APPROVED** – lịch sử |

---

## Kịch bản demo theo vai trò

---

### Vai trò 1 – Admin (`admin`)

**Mục tiêu:** Quản lý tài khoản người dùng trong hệ thống.

1. Đăng nhập → Dashboard hiển thị thống kê
2. **Quản lý người dùng** → danh sách tất cả tài khoản
   - Lọc theo vai trò "Giáo viên" → thấy 5 giáo viên
   - Lọc theo "Học sinh" → thấy 7 học sinh có tài khoản
3. **Thêm người dùng** → tạo tài khoản mới (ví dụ ACADEMIC_STAFF)
   - Điền username, email, password (≥ 6 ký tự), chọn vai trò
4. **Chỉnh sửa** tài khoản → đổi trạng thái → **Ngưng hoạt động**
5. **Đặt lại mật khẩu** cho một tài khoản
6. **Vai trò** → xem ma trận quyền hạn
7. **Quy định / Tham số** → xem cấu hình năm học 2025-2026

---

### Vai trò 2 – Giáo vụ (`giaovu01`)

**Mục tiêu:** Quản lý toàn bộ nghiệp vụ học đường.

#### 2a. Tổng quan
1. Đăng nhập → **Dashboard**:
   - Thống kê: ~70 học sinh, 5 lớp, 12 bảng điểm, 7 đã khóa, 1 yêu cầu chờ
   - Nút tắt nhanh đến các chức năng chính

#### 2b. Quản lý học sinh
2. **Quản lý học sinh** → danh sách ~70 học sinh
   - Lọc theo trạng thái "Chờ phân lớp" → thấy 3 học sinh (S006, S601, S602)
3. **Phân lớp** → chọn học kỳ HK2 → chọn S601 (Nguyễn Thị Tuyết) → phân vào 10A1
   - Thấy sĩ số 10A1 tăng lên 21

#### 2c. Phân công giáo viên  
4. **Phân công giáo viên** → tìm lớp 11A2 (chưa có GVCN)
5. Thêm phân công HOMEROOM cho teacher03 (Lê Văn Cường) vào 11A2

#### 2d. Điểm số
6. **Tra cứu điểm** → tìm bảng điểm "Vật lý / 10A1 / HK1" (trạng thái **SUBMITTED**)
7. Nhấn **Xem** → trang chi tiết hiển thị đầy đủ điểm 20 học sinh
8. Nhấn **Khóa bảng điểm** → bảng điểm chuyển sang **LOCKED** ✓

#### 2e. Yêu cầu sửa điểm
9. **Yêu cầu sửa điểm** → thấy 1 PENDING từ teacher01
10. Mở chi tiết → xem điểm cũ / mới / lý do
11. Nhấn **Duyệt** → thêm ghi chú duyệt → xác nhận
    - Yêu cầu chuyển sang **APPROVED** ✓

---

### Vai trò 3 – Giáo viên chủ nhiệm + Bộ môn (`teacher01`)

**Ngữ cảnh:** Nguyễn Tuấn An — GVCN lớp 10A1, dạy Toán cho 10A1 và 10A2.

#### 3a. Xem phân công
1. Đăng nhập → **Phân công của tôi**:
   - 1 phân công GVCN: 10A1 – năm 2025-2026
   - 2 phân công Bộ môn HK1: Toán/10A1, Toán/10A2
   - 2 phân công Bộ môn HK2: Toán/10A1, Toán/10A2

#### 3b. Nhập điểm HK2
2. **Nhập bảng điểm** → chọn "Toán / 10A1 / HK2" (DRAFT)
   - Thấy 20 học sinh; 10 học sinh đầu đã có điểm, 10 còn lại chưa
3. Nhấn vào một học sinh chưa có điểm → nhập điểm (Miệng, Một tiết, Giữa kỳ, Cuối kỳ)
4. Nhấn **Lưu** → điểm trung bình tự tính ✓
5. Sau khi nhập đủ 20 học sinh → **Nộp bảng điểm** (DRAFT → SUBMITTED)

#### 3c. Đặc quyền GVCN – Xem tất cả môn lớp chủ nhiệm
6. **Tra cứu điểm** → bộ lọc "Lớp 10A1, HK1"
   - Thấy **5 bảng điểm** của 10A1: Toán, Văn, Anh, Vật lý, Hóa
   - Cột "Quyền": Toán hiện **"GVBM – xem & nhập"**, các môn khác **"GVCN – xem tất cả môn"**
7. Nhấn **Xem** vào bảng Văn/10A1/HK1 → xem được điểm Văn của học sinh lớp mình ✓

#### 3d. Yêu cầu sửa điểm
8. Mở bảng điểm Toán / 10A1 / HK1 (LOCKED) → tìm học sinh Lê Minh Châu (S003)
9. Nhấn **Yêu cầu sửa điểm** trên cột Giữa kỳ → điền điểm mới, lý do
10. **Gửi yêu cầu** → yêu cầu tạo với trạng thái **PENDING** ✓
11. **Yêu cầu sửa điểm** → thấy yêu cầu đang chờ giáo vụ duyệt

#### 3e. Báo cáo lớp chủ nhiệm
12. **Báo cáo lớp chủ nhiệm** → chọn 10A1 / HK1
    - Hiển thị bảng xếp hạng học sinh, điểm TB lớp, tỷ lệ đạt
    - Nhấn vào tên học sinh để xem chi tiết

---

### Vai trò 4 – Giáo viên chủ nhiệm khác (`teacher02`)

**Ngữ cảnh:** Trần Thị Bích Ngọc — GVCN lớp 10A2, dạy Văn 10A1 + 10A2.

1. Đăng nhập → **Tra cứu điểm**:
   - Thấy bảng điểm Văn/10A1/HK1 (GVBM) + Văn/10A2/HK1 (GVBM)
   - Thấy thêm Toán/10A2/HK1 (GVCN – xem tất cả môn lớp 10A2) ✓
2. **Báo cáo môn giảng dạy** → chọn Ngữ văn / HK1 → so sánh kết quả 10A1 vs 10A2

---

### Vai trò 5 – Ban giám hiệu (`manager01`)

**Mục tiêu:** Theo dõi kết quả học tập toàn trường (chỉ đọc).

1. Đăng nhập → **Dashboard** → thống kê toàn trường
2. **Quản lý học sinh** (chỉ xem) → lọc theo lớp, tìm học sinh
3. **Báo cáo** → chọn HK1:
   - **Báo cáo lớp 10A1**: điểm TB, tỷ lệ đạt, xếp hạng từng học sinh
   - So sánh với 10A2 (xem báo cáo môn Toán HK1)
4. **Quy định / Tham số** → xem cấu hình (không sửa được)
5. **Phân công giáo viên** → xem toàn bộ phân công (chỉ xem)

---

### Vai trò 6 – Học sinh (`student01`)

**Ngữ cảnh:** Nguyễn Văn An – học sinh lớp 10A1, hiệu suất khá (perf=4).

1. Đăng nhập → **Dashboard** → thấy tên, lớp, shortcut xem điểm
2. **Hồ sơ cá nhân**:
   - Thông tin tài khoản: username, email, vai trò
   - Hồ sơ học sinh: mã, họ tên, giới tính, ngày sinh, ngày nhập học
   - Lớp hiện tại: 10A1 / HK2 / 2025-2026
   - Nút "Xem điểm của tôi"
3. **Điểm của tôi**:
   - HK1: Toán, Văn, Anh, Vật lý (đều LOCKED – điểm chính xác)
   - HK2: Toán, Văn (DRAFT – điểm đang được nhập)
   - Xem điểm TB từng môn, kết quả Đạt / Chưa đạt

---

### Luồng kết hợp: Quy trình đầy đủ một bảng điểm

```
GV nhập điểm (teacher01)
  → Nhập bảng điểm DRAFT
  → Nộp: DRAFT → SUBMITTED

Giáo vụ kiểm tra (giaovu01)
  → Mở bảng điểm SUBMITTED
  → Xem điểm từng học sinh
  → Khóa: SUBMITTED → LOCKED

Giáo viên cần sửa (teacher01)
  → Gửi yêu cầu sửa điểm (PENDING)

Giáo vụ duyệt (giaovu01)
  → Duyệt yêu cầu → APPROVED

Học sinh xem kết quả (student01)
  → Điểm của tôi → thấy điểm đã được khóa
```

---

## Lưu ý kỹ thuật

- **Seed idempotent**: chạy `npm run prisma:seed` nhiều lần không tạo bản trùng
- **Reset demo**: chạy lại seed để khôi phục về trạng thái ban đầu
- **Backend restart cần thiết** sau khi thay đổi code: dừng cửa sổ backend → `npm run start`
- **Tham số hệ thống**: tuổi 15–20, sĩ số tối đa 40, thang điểm 0–10, điểm đạt 5.0
