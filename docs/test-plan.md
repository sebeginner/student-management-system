# Test Plan — Kế hoạch kiểm thử hệ thống Quản lý học sinh SE104

---

## 1. Mục tiêu kiểm thử

Đảm bảo hệ thống demo ổn định theo luồng chính:

```
Đăng nhập → Quản lý học sinh → Phân lớp → Phân công GV → Nhập điểm → Khóa điểm → SCR → Tra cứu → Báo cáo
```

---

## 2. Phạm vi kiểm thử

### Có kiểm thử

- Auth và phân quyền theo role + scope TeacherAssignment.
- CRUD học sinh, lớp, giáo viên.
- Phân lớp và chuyển lớp.
- Phân công GVCN/GVBM.
- Nhập điểm, tính điểm trung bình.
- Submit, khóa bảng điểm.
- Yêu cầu sửa điểm (tạo, duyệt, từ chối).
- Tra cứu điểm (theo lớp, cá nhân học sinh).
- Báo cáo môn/học kỳ/dashboard.
- Hạnh kiểm (tạo, nộp, chốt).
- Thời khóa biểu (tạo, xem, xóa).
- Import học sinh Excel.
- Xuất PDF bảng điểm và phiếu kết quả.
- Nhật ký hệ thống.
- Tham số hệ thống.

### Ngoài phạm vi MVP

- Load test / stress test.
- Security test chuyên sâu (pentest).
- Automated e2e test đầy đủ.
- Mobile responsive test.

---

## 3. Môi trường test

- Backend: `http://localhost:3000/api/v1`
- Frontend: `http://localhost:5173`
- Database: PostgreSQL (local hoặc Docker)
- Công cụ: Swagger UI (`http://localhost:3000/api`), Postman, browser, Prisma Studio.

---

## 4. Tài khoản test

| Role | Username | Password | Ghi chú |
|---|---|---|---|
| ADMIN | `admin` | `Admin@123` | Quản lý tài khoản, role, tham số |
| ACADEMIC_STAFF | `giaovu01` | `Staff@123` | Toàn quyền nghiệp vụ |
| MANAGER | `manager01` | `Manager@123` | Chỉ xem báo cáo |
| TEACHER (GVCN 10A1 + GVBM Toán) | `teacher01` | `Teacher@123` | Nhập điểm Toán 10A1, 10A2 |
| TEACHER (GVCN 10A2 + GVBM Văn) | `teacher02` | `Teacher@123` | Không được sửa Toán |
| STUDENT | `student01` | `Student@123` | Chỉ xem điểm cá nhân |

---

## 5. Test Cases

### TC-AUTH — Xác thực

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-AUTH-01 | Đăng nhập đúng username/password | Trả JWT token; điều hướng đúng dashboard theo role |
| TC-AUTH-02 | Đăng nhập sai mật khẩu | 401; frontend hiển thị thông báo rõ ràng |
| TC-AUTH-03 | Tài khoản bị khóa (`status=LOCKED`) | 403 hoặc 401; không cấp token |
| TC-AUTH-04 | Gọi API không có token | 401 Unauthorized |
| TC-AUTH-05 | Gọi API với token hết hạn | 401; frontend chuyển về login |

### TC-STU — Học sinh

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-STU-01 | Thêm học sinh hợp lệ (tuổi 15-20) | Lưu; xuất hiện trong danh sách với status PENDING_CLASS_ASSIGNMENT |
| TC-STU-02 | Tuổi dưới tối thiểu (< 15) | 400; không lưu |
| TC-STU-03 | Tuổi trên tối đa (> 20) | 400; không lưu |
| TC-STU-04 | Trùng mã học sinh | 409; không tạo bản ghi mới |
| TC-STU-05 | Email sai định dạng | 400; không lưu |
| TC-STU-06 | STUDENT thử sửa học sinh khác | 403 Forbidden |
| TC-STU-07 | Tìm kiếm theo từ khóa | Trả danh sách khớp |

### TC-CLS — Lớp học

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-CLS-01 | Tạo lớp hợp lệ | Lưu; hiển thị trong danh sách lớp |
| TC-CLS-02 | Tạo lớp trùng tên trong cùng năm học | 409 |
| TC-CLS-03 | Xem danh sách học sinh lớp | Trả học sinh có enrollment ACTIVE |

### TC-ENR — Phân lớp và chuyển lớp

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-ENR-01 | Phân học sinh PENDING vào lớp còn chỗ | Enrollment ACTIVE; currentSize tăng |
| TC-ENR-02 | Phân học sinh đã có lớp active trong cùng HK | 409 STUDENT_ALREADY_ENROLLED |
| TC-ENR-03 | Phân vào lớp đã đủ sĩ số (40 hs) | 409 CLASS_FULL |
| TC-ENR-04 | Chuyển lớp cùng khối (10A1 → 10A2) | Enrollment cũ TRANSFERRED; enrollment mới ACTIVE; currentSize cập nhật cả hai lớp |
| TC-ENR-05 | Chuyển lớp khác khối (10A1 → 11A1) | 400 INVALID_TRANSFER_DIFFERENT_GRADE |

### TC-TA — Phân công giáo viên

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-TA-01 | Phân công GVCN cho lớp chưa có GVCN | Tạo assignment HOMEROOM; subjectId=null, semesterId=null |
| TC-TA-02 | Phân công GVCN thứ 2 cho cùng lớp/năm (đã có) | 409 HOMEROOM_ALREADY_ASSIGNED |
| TC-TA-03 | Phân công GVBM hợp lệ | Tạo assignment SUBJECT với classId+subjectId+semesterId |
| TC-TA-04 | Phân công GVBM thứ 2 cho cùng lớp/môn/HK | 409 SUBJECT_TEACHER_ALREADY_ASSIGNED |

### TC-SCO — Nhập điểm

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-SCO-01 | Nhập điểm hợp lệ (0–10) | Lưu điểm; tính đúng điểm trung bình |
| TC-SCO-02 | Nhập điểm âm | 400 SCORE_INVALID_RANGE |
| TC-SCO-03 | Nhập điểm > 10 | 400 SCORE_INVALID_RANGE |
| TC-SCO-04 | Tính điểm trung bình theo công thức | Miệng=8, 1tiết=7, GK=8, CK=9 → `(8×1+7×2+8×3+9×3)/9 ≈ 8.11` |
| TC-SCO-05 | teacher02 nhập điểm Toán/10A1 | 403 NOT_SUBJECT_TEACHER |
| TC-SCO-06 | teacher01 nhập điểm Văn/10A1 (chỉ là GVCN, không phải GVBM Văn) | 403 NOT_SUBJECT_TEACHER |
| TC-SCO-07 | Submit khi thiếu MIDTERM hoặc FINAL | 400 SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES |
| TC-SCO-08 | TEACHER thử khóa bảng điểm | 403 (chỉ ACADEMIC_STAFF được khóa) |
| TC-SCO-09 | Nhập điểm bảng đã LOCKED | 403 SCORE_SHEET_LOCKED |

### TC-SCR — Yêu cầu sửa điểm

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-SCR-01 | GVBM tạo SCR cho bảng điểm LOCKED | Tạo PENDING |
| TC-SCR-02 | Tạo SCR cho bảng điểm DRAFT/SUBMITTED | 400 — chỉ tạo khi LOCKED |
| TC-SCR-03 | Tạo SCR trùng (cùng học sinh/loại điểm đang PENDING) | 409 SCORE_CHANGE_REQUEST_DUPLICATED |
| TC-SCR-04 | TEACHER thử approve/reject SCR | 403 ONLY_ACADEMIC_STAFF_CAN_APPROVE |
| TC-SCR-05 | Giáo vụ approve SCR | Status → APPROVED; điểm cập nhật; trung bình tính lại |
| TC-SCR-06 | Giáo vụ reject SCR | Status → REJECTED; điểm giữ nguyên; reviewNote lưu |

### TC-RPT — Báo cáo

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-RPT-01 | Báo cáo tổng kết môn | Có studentCount, passCount, passRate theo lớp |
| TC-RPT-02 | Báo cáo học kỳ khi chưa có dữ liệu | Trả mảng rỗng, không crash |
| TC-RPT-03 | MANAGER xem dashboard-summary | Trả số liệu toàn trường |
| TC-RPT-04 | TEACHER xem báo cáo môn ngoài phân công | 403 FORBIDDEN_REPORT_SCOPE |
| TC-RPT-05 | STUDENT xem báo cáo cá nhân | Trả đúng điểm cá nhân |

### TC-CONDUCT — Hạnh kiểm

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-CON-01 | GVCN tạo hạnh kiểm cả lớp (batch) | Tạo DRAFT cho tất cả hs active trong lớp |
| TC-CON-02 | GVCN nộp hạnh kiểm | Status → SUBMITTED |
| TC-CON-03 | Giáo vụ chốt hạnh kiểm | Status → FINALIZED; finalRating lưu |
| TC-CON-04 | Không phải GVCN thử tạo hạnh kiểm | 403 |

### TC-TT — Thời khóa biểu

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-TT-01 | Tạo slot TKB hợp lệ | Lưu; hiển thị trong grid |
| TC-TT-02 | Trùng lịch lớp (cùng tiết) | 409 unique_class_slot violation |
| TC-TT-03 | Trùng lịch giáo viên (cùng tiết) | 409 unique_teacher_slot violation |
| TC-TT-04 | STUDENT xem TKB cá nhân | Trả TKB lớp của học sinh đó |

### TC-IMPORT — Import Excel

| Mã | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC-IMP-01 | Import file học sinh hợp lệ | Preview không có lỗi; commit tạo học sinh PENDING |
| TC-IMP-02 | Import file có học sinh trùng mã | Hàng đó đánh dấu lỗi trong preview; commit chỉ tạo hàng hợp lệ |
| TC-IMP-03 | Import file có tuổi ngoài phạm vi | Hàng đó đánh dấu lỗi |
| TC-IMP-04 | TEACHER thử import học sinh | 403 |

---

## 6. Checklist trước khi demo

- [ ] Chạy được database (PostgreSQL).
- [ ] Chạy được backend (`npm run start`).
- [ ] Chạy được frontend (`npm run dev`).
- [ ] Seed data thành công (`npm run prisma:seed`).
- [ ] Đăng nhập được: admin, giaovu01, manager01, teacher01–02, student01.
- [ ] Dashboard hiển thị đúng theo role.
- [ ] Thêm học sinh được.
- [ ] Phân lớp học sinh được.
- [ ] Tra cứu bảng điểm được.
- [ ] Nhập điểm được (teacher01 với Toán 10A1 HK2).
- [ ] Submit bảng điểm được.
- [ ] Khóa bảng điểm được (giaovu01).
- [ ] Tạo yêu cầu sửa điểm được (teacher01).
- [ ] Duyệt yêu cầu sửa điểm được (giaovu01).
- [ ] Học sinh tra cứu điểm cá nhân được.
- [ ] Báo cáo chạy được (class-semester, subject-summary, dashboard).
- [ ] Xuất PDF bảng điểm được.
- [ ] README có hướng dẫn chạy đầy đủ.
- [ ] Seed idempotent (chạy 2 lần không bị lỗi).
- [ ] Build frontend và backend không có lỗi TypeScript.

---

## 7. Quy tắc ghi bug

Bug report cần có:

```
Tên bug:
Môi trường: (dev/staging/prod, OS, browser)
Bước tái hiện:
Kết quả thực tế:
Kết quả mong đợi:
Ảnh chụp / log:
Người phụ trách:
Mức độ: Critical / High / Medium / Low
```
