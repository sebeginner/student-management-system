# Business Rules — Quy tắc nghiệp vụ hệ thống Quản lý học sinh SE104

Tài liệu này là nguồn tham chiếu chính cho backend service và QA khi kiểm tra nghiệp vụ.

---

## 1. Quy tắc tài khoản và phân quyền

| Mã | Quy tắc | Ưu tiên |
|---|---|---|
| BR-AUTH-01 | Username phải duy nhất | Must |
| BR-AUTH-02 | Email tài khoản phải duy nhất | Must |
| BR-AUTH-03 | Mật khẩu phải được hash bằng bcrypt, không lưu plain text | Must |
| BR-AUTH-04 | Chỉ tài khoản `ACTIVE` mới được đăng nhập | Must |
| BR-AUTH-05 | API nghiệp vụ phải yêu cầu JWT hợp lệ | Must |
| BR-AUTH-06 | Role hệ thống gồm: `ADMIN`, `ACADEMIC_STAFF`, `MANAGER`, `TEACHER`, `STUDENT` | Must |
| BR-AUTH-07 | GVCN và GVBM không phải role riêng; xác định qua `TeacherAssignment.assignmentType` | Must |

---

## 2. Quy tắc học sinh

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-STU-01 | Mã học sinh duy nhất | `studentCode` không trùng | Must |
| BR-STU-02 | Họ tên bắt buộc | `fullName` không rỗng | Must |
| BR-STU-03 | Ngày sinh bắt buộc | Dùng để kiểm tra tuổi | Must |
| BR-STU-04 | Tuổi hợp lệ | `minAge <= tuổi <= maxAge` theo `SystemParameter` (mặc định 15–20) | Must |
| BR-STU-05 | Email hợp lệ | Nếu nhập email thì đúng định dạng | Should |
| BR-STU-06 | Học sinh mới ở trạng thái chờ phân lớp | `status = PENDING_CLASS_ASSIGNMENT` khi chưa có lớp | Must |
| BR-STU-07 | Không xóa cứng học sinh đã có enrollment/điểm | Chỉ chuyển `status = INACTIVE` | Should |

Trạng thái học sinh: `PENDING_CLASS_ASSIGNMENT`, `ACTIVE`, `SUSPENDED`, `TRANSFERRED`, `GRADUATED`, `INACTIVE`.

---

## 3. Quy tắc lớp học

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-CLS-01 | Mã lớp duy nhất | `classCode` không trùng | Must |
| BR-CLS-02 | Tên lớp không trùng trong cùng năm học | `@@unique([schoolYearId, name])` | Must |
| BR-CLS-03 | Lớp thuộc đúng khối lớp và năm học | FK đến `GradeLevel`, `SchoolYear` | Must |
| BR-CLS-04 | Sĩ số không vượt tối đa | `currentSize <= maxSize` và `SystemParameter.maxClassSize` (mặc định 40) | Must |
| BR-CLS-05 | Không xóa cứng lớp đã có học sinh/điểm | Chỉ đổi status | Should |

---

## 4. Quy tắc phân lớp và chuyển lớp

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-ENR-01 | Một học sinh chỉ có một lớp trong một học kỳ | Unique `[studentId, semesterId, status=ACTIVE]` | Must |
| BR-ENR-02 | Chỉ `ACADEMIC_STAFF` được phân lớp và chuyển lớp | | Must |
| BR-ENR-03 | Sĩ số lớp đích không vượt `maxClassSize` khi thêm học sinh | | Must |
| BR-ENR-04 | Chuyển lớp phải dùng transaction | Cập nhật cả enrollment cũ, mới và `currentSize` hai lớp | Must |
| BR-ENR-05 | Không mất lịch sử enrollment khi chuyển lớp | Enrollment cũ → `TRANSFERRED` + `endedAt` | Must |
| BR-ENR-06 | Chuyển lớp giữ nguyên điểm đã nhập | Điểm gắn với `classId` trong `ScoreSheet`, không bị xóa khi chuyển | Must |
| BR-ENR-07 | Không chuyển sang lớp khác khối trong phase hiện tại | Chỉ cho phép cùng khối (same `gradeLevelId`) | Should |

---

## 5. Quy tắc môn học

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SUB-01 | Mã môn học duy nhất | `subjectCode` không trùng | Must |
| BR-SUB-02 | Tên môn học bắt buộc | `name` không rỗng | Must |
| BR-SUB-03 | Hệ số môn là số nguyên dương | `coefficient >= 1` | Should |
| BR-SUB-04 | Không xóa cứng môn đã có điểm | Chỉ chuyển `isActive = false` | Should |

---

## 6. Quy tắc học kỳ và năm học

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SEM-01 | Tên năm học duy nhất | Ví dụ: `2025-2026` | Must |
| BR-SEM-02 | Tên học kỳ không trùng trong cùng năm học | `@@unique([schoolYearId, name])` | Must |
| BR-SEM-03 | Ngày bắt đầu < ngày kết thúc | Áp dụng cho cả năm học và học kỳ | Must |

---

## 7. Quy tắc phân công giáo viên

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-TA-01 | GVCN và GVBM là assignment của TEACHER | Không tạo role riêng | Must |
| BR-TA-02 | Assignment HOMEROOM: `subjectId = null`, `semesterId = null` | Áp dụng theo năm học, không gắn với học kỳ | Must |
| BR-TA-03 | Assignment SUBJECT: `classId`, `subjectId`, `semesterId` đều bắt buộc | | Must |
| BR-TA-04 | Một lớp chỉ có một GVCN active trong cùng năm học | Enforce bằng partial unique index | Must |
| BR-TA-05 | Một lớp/môn/học kỳ chỉ có một GVBM chính active | Enforce bằng partial unique index | Must |
| BR-TA-06 | Phân công là cơ sở kiểm tra quyền nhập/xem điểm | Không chỉ check role | Must |

---

## 8. Quy tắc nhập điểm

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SCO-01 | Điểm trong khoảng cho phép | `minScore <= score <= maxScore` (mặc định 0–10) | Must |
| BR-SCO-02 | Bảng điểm unique theo lớp/môn/học kỳ | `@@unique([classId, subjectId, semesterId])` | Must |
| BR-SCO-03 | Mỗi học sinh chỉ có một dòng điểm trong bảng | `@@unique([scoreSheetId, studentId])` | Must |
| BR-SCO-04 | Loại điểm có thể nhiều lần nếu `isMultiple = true` | Miệng/15p và 1 tiết có thể có nhiều lần | Should |
| BR-SCO-05 | Chỉ GVBM đúng lớp/môn/HK mới được nhập điểm | Backend kiểm tra `TeacherAssignment` | Must |
| BR-SCO-06 | GVCN không nhập điểm nếu không đồng thời là GVBM | HOMEROOM assignment không đủ quyền nhập điểm | Must |
| BR-SCO-07 | Không sửa trực tiếp bảng điểm đã `LOCKED` | Phải dùng `ScoreChangeRequest` | Must |
| BR-SCO-08 | Không nhập điểm cho học sinh không thuộc lớp | Backend kiểm tra enrollment | Must |

Công thức tính điểm trung bình môn:

```text
ĐTB môn = (avgOral × 1 + avgOnePeriod × 2 + midterm × 3 + final × 3) / 9
```

Trong đó `avgOral` và `avgOnePeriod` là trung bình số học của các lần kiểm tra tương ứng.

Loại kiểm tra (TestType):

| Code | Tên | Hệ số | Nhiều lần? |
|---|---:|---:|---|
| ORAL_15M | Miệng/15 phút | 1 | Có |
| ONE_PERIOD | 1 tiết | 2 | Có |
| MIDTERM | Giữa kỳ | 3 | Không |
| FINAL | Cuối kỳ | 3 | Không |

---

## 9. Quy tắc trạng thái bảng điểm

```
DRAFT → SUBMITTED → LOCKED
              ↕
       NEEDS_CORRECTION
```

| Trạng thái | Ý nghĩa |
|---|---|
| `DRAFT` | Đang nhập điểm, chưa hoàn thiện |
| `SUBMITTED` | GVBM đã nộp, chờ Giáo vụ kiểm tra và khóa |
| `LOCKED` | Đã khóa, chính thức; điểm chỉ thay đổi qua SCR |
| `NEEDS_CORRECTION` | Giáo vụ mở lại để sửa ngoại lệ (không phải workflow thông thường) |

Quy tắc:
- Submit: bảng điểm phải có `MIDTERM` và `FINAL` cho tất cả học sinh active.
- **Khóa: chỉ `ACADEMIC_STAFF` được thực hiện.**
- Báo cáo chính thức chỉ dùng bảng điểm `LOCKED`.

---

## 10. Quy tắc yêu cầu sửa điểm (ScoreChangeRequest)

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SCR-01 | Chỉ tạo yêu cầu khi bảng điểm `LOCKED` | `ScoreSheet.status = LOCKED` | Must |
| BR-SCR-02 | Chỉ GVBM đúng lớp/môn/học kỳ mới tạo được yêu cầu | HOMEROOM assignment không đủ quyền tạo SCR | Must |
| BR-SCR-03 | Yêu cầu phải lưu điểm cũ, điểm mới, lý do | Bắt buộc trong `score_change_requests` | Must |
| BR-SCR-04 | Không tạo trùng yêu cầu PENDING cho cùng học sinh/bảng điểm/loại điểm | Partial unique index theo status PENDING | Must |
| BR-SCR-05 | **Chỉ `ACADEMIC_STAFF` được duyệt/từ chối yêu cầu** | TEACHER không được approve/reject | Must |
| BR-SCR-06 | Duyệt → cập nhật điểm và tính lại điểm trung bình | Thực hiện trong transaction | Must |
| BR-SCR-07 | Từ chối → giữ nguyên điểm cũ, lưu lý do từ chối | `status = REJECTED`, `reviewNote` | Must |
| BR-SCR-08 | Không xóa yêu cầu đã xử lý | Giữ lịch sử để audit | Should |

---

## 11. Quy tắc đạt/không đạt

| Mã | Quy tắc | Diễn giải |
|---|---|---|
| BR-PASS-01 | Đạt môn nếu ĐTB môn ≥ `subjectPassScore` | Mặc định 5.0 |
| BR-PASS-02 | Đạt học kỳ nếu ĐTB học kỳ ≥ `semesterPassScore` | Mặc định 5.0 |
| BR-PASS-03 | Tỷ lệ đạt = số lượng đạt / sĩ số × 100 | Làm tròn 2 chữ số |
| BR-PASS-04 | Không chia cho 0 | Trả 0% nếu sĩ số = 0 |

Xếp loại học lực học kỳ (`SemesterStudentResult.academicRating`):

| Xếp loại | Điều kiện |
|---|---|
| EXCELLENT (Giỏi) | ĐTB HK ≥ 8.0 và điểm TB môn thấp nhất ≥ 6.5 |
| GOOD (Khá) | ĐTB HK ≥ 6.5 và điểm TB môn thấp nhất ≥ 5.0 |
| AVERAGE (Trung bình) | ĐTB HK ≥ 5.0 và điểm TB môn thấp nhất ≥ 3.5 |
| WEAK (Yếu) | ĐTB HK ≥ 3.5 và điểm TB môn thấp nhất ≥ 2.0 |
| POOR (Kém) | Các trường hợp còn lại |

---

## 12. Quy tắc chốt học kỳ và tổng kết năm (UC2)

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-FIN-01 | Chỉ `ACADEMIC_STAFF` được chốt kết quả học kỳ | `POST /semesters/:id/finalize` | Must |
| BR-FIN-02 | Kết quả học kỳ tính từ bảng điểm `LOCKED` | Không dùng DRAFT/SUBMITTED | Must |
| BR-FIN-03 | ĐTB năm = (ĐTB HK1 × 1 + ĐTB HK2 × 2) / 3 | Quy tắc TT58 đơn giản hóa | Must |
| BR-FIN-04 | Quyết định lên lớp: ADVANCE / REMEDIAL / CONDUCT_REVIEW / RETAIN | Lưu trong `YearEndResult.decision` | Must |
| BR-FIN-05 | Hạnh kiểm phải được FINALIZED trước khi tổng kết năm | `ConductAssessment.status = FINALIZED` | Should |

---

## 13. Quy tắc hạnh kiểm (UC1)

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-CON-01 | Chỉ GVCN tạo và nộp hạnh kiểm lớp mình | HOMEROOM assignment required | Must |
| BR-CON-02 | Chỉ `ACADEMIC_STAFF` được chốt (finalize) hạnh kiểm | | Must |
| BR-CON-03 | Mỗi học sinh chỉ có một hạnh kiểm trong một học kỳ | `@@unique([studentId, semesterId])` | Must |
| BR-CON-04 | Tiêu chí đánh giá: ATTENDANCE, DISCIPLINE, ACADEMIC, ACTIVITIES | | Must |
| BR-CON-05 | Xếp loại hạnh kiểm: EXCELLENT, GOOD, AVERAGE, WEAK | | Must |

---

## 14. Quy tắc báo cáo

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-RPT-01 | Báo cáo chính thức dùng bảng điểm `LOCKED` | `includeUnOfficial = false` (mặc định) | Must |
| BR-RPT-02 | Có thể xem tạm khi truyền `includeUnOfficial = true` | Response có `isOfficial = false` | Should |
| BR-RPT-03 | Không crash khi chưa có dữ liệu | Trả mảng rỗng hoặc số 0 | Must |
| BR-RPT-04 | TEACHER chỉ xem báo cáo theo scope phân công | Không xem báo cáo lớp/môn ngoài phạm vi | Must |

---

## 15. Quy tắc tham số hệ thống

| Mã | Quy tắc | Diễn giải |
|---|---|---|
| BR-PAR-01 | `minAge < maxAge` | Ví dụ 15 < 20 |
| BR-PAR-02 | `maxClassSize > 0` | Ví dụ 40 |
| BR-PAR-03 | `minScore <= maxScore` | Ví dụ 0 ≤ 10 |
| BR-PAR-04 | `subjectPassScore` và `semesterPassScore` nằm trong `[minScore, maxScore]` | |
| BR-PAR-05 | Tham số gắn với năm học (`schoolYearId`) | Thay đổi không ảnh hưởng dữ liệu năm cũ |

---

## 17. Quy tắc thông báo (UC-22)

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-NTF-01 | Chỉ ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER được tạo thông báo | STUDENT không tạo được | Must |
| BR-NTF-02 | TEACHER bắt buộc phải chọn `classId` khi tạo | Không cho phép gửi toàn trường hoặc theo role | Must |
| BR-NTF-03 | TEACHER chỉ chọn lớp mình được phân công | Backend kiểm tra `TeacherAssignment` active — 403 nếu lớp không hợp lệ | Must |
| BR-NTF-04 | Thông báo TEACHER luôn gửi đến `targetRole = 'STUDENT'` | Giáo viên chỉ nhắn học sinh lớp mình, không gửi cho GV khác | Must |
| BR-NTF-05 | Học sinh chỉ thấy thông báo thuộc phạm vi của mình | `classId = null` hoặc `classId` trong các lớp đang theo học | Must |
| BR-NTF-06 | Chỉ ADMIN và ACADEMIC_STAFF được xoá thông báo | | Must |
| BR-NTF-07 | Đọc thông báo lưu vào `NotificationRead` (upsert — không tạo trùng) | | Must |
| BR-NTF-08 | Số thông báo chưa đọc = tổng thông báo trong phạm vi − số đã đọc | Dùng cho badge chuông | Must |

---

## 16. Quy tắc ghi log (UC6)

Các thao tác quan trọng cần ghi vào `AuditLog`:

- Đăng nhập thành công/thất bại.
- Tạo/sửa/xóa học sinh.
- Phân lớp/chuyển lớp.
- Tạo/submit/lock bảng điểm.
- Tạo/duyệt/từ chối yêu cầu sửa điểm.
- Chốt hạnh kiểm.
- Chốt kết quả học kỳ/năm.
- Thay đổi tham số hệ thống.
- Thay đổi role/quyền.
- Import học sinh/điểm.
