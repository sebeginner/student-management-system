# Business Rules - Quy tắc nghiệp vụ hệ thống Quản lý học sinh

Tài liệu này là nguồn tham chiếu chính cho backend service và QA khi kiểm tra nghiệp vụ.

## 1. Quy tắc tài khoản và phân quyền

| Mã | Quy tắc | Ưu tiên |
|---|---|---|
| BR-AUTH-01 | Username phải duy nhất | Must |
| BR-AUTH-02 | Email tài khoản phải duy nhất nếu có | Must |
| BR-AUTH-03 | Mật khẩu phải được hash, không lưu plain text | Must |
| BR-AUTH-04 | Chỉ tài khoản ACTIVE mới được đăng nhập | Must |
| BR-AUTH-05 | API nghiệp vụ phải yêu cầu JWT hợp lệ | Must |
| BR-AUTH-06 | Role hệ thống gồm ADMIN, ACADEMIC_STAFF, MANAGER, TEACHER, STUDENT | Must |

## 2. Quy tắc học sinh

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-STU-01 | Mã học sinh duy nhất | `studentCode` không trùng | Must |
| BR-STU-02 | Họ tên bắt buộc | `fullName` không rỗng | Must |
| BR-STU-03 | Ngày sinh bắt buộc | Dùng để kiểm tra tuổi | Must |
| BR-STU-04 | Tuổi hợp lệ | `minAge <= tuổi <= maxAge` theo `SystemParameter` | Must |
| BR-STU-05 | Email hợp lệ | Nếu nhập email thì đúng định dạng | Should |
| BR-STU-06 | Không xóa cứng học sinh đã có lớp/điểm | Chỉ chuyển status INACTIVE | Should |

## 3. Quy tắc lớp học

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-CLS-01 | Mã lớp duy nhất | `classCode` không trùng | Must |
| BR-CLS-02 | Tên lớp không trùng trong cùng năm học | `@@unique([schoolYearId, name])` | Must |
| BR-CLS-03 | Lớp thuộc đúng khối lớp và năm học | Có FK đến `GradeLevel`, `SchoolYear` | Must |
| BR-CLS-04 | Sĩ số không vượt tối đa | `currentSize <= maxSize` và tham số `maxClassSize` | Must |
| BR-CLS-05 | Không xóa cứng lớp đã có học sinh/điểm | Chỉ đổi status | Should |

## 4. Quy tắc phân lớp

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-ENR-01 | Một học sinh chỉ có một lớp trong một học kỳ | Theo unique `[studentId, semesterId]` | Must |
| BR-ENR-02 | Chỉ phân lớp cho học sinh ACTIVE | Không thêm học sinh đã ngừng học | Must |
| BR-ENR-03 | Khi thêm học sinh vào lớp phải cập nhật sĩ số | Tăng `currentSize` hoặc tính động | Must |
| BR-ENR-04 | Khi xóa học sinh khỏi lớp phải cập nhật sĩ số | Giảm `currentSize` hoặc tính động | Should |

## 5. Quy tắc môn học

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SUB-01 | Mã môn học duy nhất | `subjectCode` không trùng | Must |
| BR-SUB-02 | Tên môn học bắt buộc | `name` không rỗng | Must |
| BR-SUB-03 | Hệ số môn là số nguyên dương | `coefficient >= 1` | Should |
| BR-SUB-04 | Không xóa cứng môn đã có điểm | Chỉ chuyển `isActive=false` | Should |

## 6. Quy tắc học kỳ và năm học

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SEM-01 | Năm học có tên duy nhất | Ví dụ: 2025-2026 | Must |
| BR-SEM-02 | Học kỳ không trùng tên trong cùng năm học | Theo unique `[schoolYearId, name]` | Must |
| BR-SEM-03 | Ngày bắt đầu phải nhỏ hơn ngày kết thúc | Áp dụng cho năm học và học kỳ | Must |
| BR-SEM-04 | Chỉ có một năm học/học kỳ active tại một thời điểm nếu nhóm chọn quy tắc này | Should |

## 7. Quy tắc phân công giáo viên

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-TA-01 | GVCN và GVBM là assignment của TEACHER | Không tạo role đăng nhập riêng cho GVCN/GVBM | Must |
| BR-TA-02 | Assignment HOMEROOM không gắn môn/học kỳ | `subjectId = null`, `semesterId = null` | Must |
| BR-TA-03 | Assignment SUBJECT bắt buộc có lớp, môn, học kỳ | `classId`, `subjectId`, `semesterId` đều có giá trị | Must |
| BR-TA-04 | Một lớp chỉ có một GVCN active | Enforce bằng partial unique index theo class cho HOMEROOM | Must |
| BR-TA-05 | Một lớp/môn/học kỳ chỉ có một GVBM chính | Enforce bằng partial unique index theo class/subject/semester cho SUBJECT | Must |

## 8. Quy tắc điểm số

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SCO-01 | Điểm phải nằm trong khoảng cho phép | `minScore <= score <= maxScore` | Must |
| BR-SCO-02 | Điểm mặc định theo báo cáo là 0 đến 10 | Có thể thay bằng tham số | Must |
| BR-SCO-03 | Một bảng điểm là duy nhất theo lớp, môn, học kỳ | Theo unique `[classId, subjectId, semesterId]` | Must |
| BR-SCO-04 | Một học sinh chỉ có một dòng điểm trong một bảng điểm | Theo unique `[scoreSheetId, studentId]` | Must |
| BR-SCO-05 | Một loại kiểm tra có thể có nhiều lần nếu `isMultiple=true` | Ví dụ miệng/15 phút, 1 tiết | Should |
| BR-SCO-06 | Không sửa trực tiếp bảng điểm đã khóa | GVBM phải tạo yêu cầu sửa điểm; Giáo vụ duyệt/từ chối | Must |

## 9. Quy tắc yêu cầu sửa điểm

| Mã | Quy tắc | Diễn giải | Ưu tiên |
|---|---|---|---|
| BR-SCR-01 | Chỉ tạo yêu cầu sửa điểm cho bảng điểm đã khóa | Dựa vào `ScoreSheet.status = LOCKED` khi implement service | Must |
| BR-SCR-02 | Yêu cầu phải lưu điểm cũ, điểm mới, lý do | Lưu trong `score_change_requests` | Must |
| BR-SCR-03 | Không tạo trùng yêu cầu đang chờ duyệt | Partial unique index cho status PENDING | Must |
| BR-SCR-04 | Duyệt yêu cầu thì cập nhật điểm và tính lại trung bình | Thực hiện trong transaction khi implement service | Must |
| BR-SCR-05 | Từ chối yêu cầu thì giữ nguyên điểm cũ và lưu lý do | Cập nhật status REJECTED, `reviewNote` | Must |

## 10. Công thức tính điểm MVP

Theo báo cáo môn học:

```text
ĐTB môn = (Cuối kỳ * 3 + Giữa kỳ * 3 + TB 1 tiết * 2 + TB Miệng/15 phút * 1) / 9
```

Trong hệ thống nên lưu hệ số qua `TestType` và `ScoreWeight` để có thể thay đổi theo năm học.

Quy ước test type MVP:

| Code | Tên | Hệ số | Nhiều lần? |
|---|---|---:|---|
| ORAL_15M | Miệng/15 phút | 1 | Có |
| ONE_PERIOD | 1 tiết | 2 | Có |
| MIDTERM | Giữa kỳ | 3 | Không |
| FINAL | Cuối kỳ | 3 | Không |

## 11. Quy tắc đạt/không đạt

| Mã | Quy tắc | Diễn giải |
|---|---|---|
| BR-PASS-01 | Đạt môn nếu ĐTB môn >= `subjectPassScore` | Mặc định 5.0 |
| BR-PASS-02 | Đạt học kỳ nếu ĐTB học kỳ >= `semesterPassScore` | Mặc định 5.0 |
| BR-PASS-03 | Tỉ lệ đạt = số lượng đạt / sĩ số * 100 | Làm tròn 2 chữ số nếu cần |

## 12. Quy tắc báo cáo

| Mã | Quy tắc | Diễn giải |
|---|---|---|
| BR-RPT-01 | Báo cáo môn tính theo môn + học kỳ | Group theo lớp |
| BR-RPT-02 | Báo cáo học kỳ tính theo học kỳ | Group theo lớp |
| BR-RPT-03 | Nếu chưa có dữ liệu, trả mảng rỗng hoặc số liệu 0 | Không crash API |
| BR-RPT-04 | Báo cáo có thể tính động trong MVP | Không bắt buộc lưu vào bảng report nếu thiếu thời gian |

## 13. Quy tắc tham số

| Mã | Quy tắc | Diễn giải |
|---|---|---|
| BR-PAR-01 | Tuổi tối thiểu < tuổi tối đa | Ví dụ 15 < 20 |
| BR-PAR-02 | Sĩ số tối đa > 0 | Ví dụ 40 |
| BR-PAR-03 | Điểm tối thiểu <= điểm tối đa | Ví dụ 0 <= 10 |
| BR-PAR-04 | Điểm đạt nằm trong khoảng điểm | Ví dụ 5 nằm trong 0-10 |
| BR-PAR-05 | Tham số gắn với năm học | Theo `schoolYearId` |

## 14. Quy tắc ghi log

Các thao tác nên ghi log:

- Đăng nhập thành công/thất bại.
- Thêm/sửa/xóa học sinh.
- Phân học sinh vào lớp.
- Nhập/sửa/khóa bảng điểm.
- Thay đổi tham số.
- Thay đổi role/quyền.
