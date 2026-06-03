# Authorization — Phân quyền hệ thống SE104

Tài liệu này mô tả nguyên tắc phân quyền và phạm vi truy cập của từng role, dựa trên `backend/src/` và quy tắc nghiệp vụ trong `AGENTS.md`.

---

## 1. Nguyên tắc phân quyền

- Backend dùng `JwtAuthGuard` + `RolesGuard` để bảo vệ tất cả endpoint.
- Mọi endpoint nghiệp vụ yêu cầu JWT hợp lệ.
- `TEACHER` cần kiểm tra thêm scope theo `TeacherAssignment` (không chỉ check role).
- `STUDENT` chỉ truy cập dữ liệu của chính mình.
- Frontend ẩn menu theo role là UX tốt, nhưng **backend bắt buộc phải enforce**.

---

## 2. GVCN và GVBM — không phải role riêng

Đây là nguyên tắc bắt buộc của hệ thống:

| Khái niệm | Cách model trong code |
|---|---|
| GVCN (Giáo viên chủ nhiệm) | `TEACHER` có `TeacherAssignment.assignmentType = HOMEROOM` |
| GVBM (Giáo viên bộ môn) | `TEACHER` có `TeacherAssignment.assignmentType = SUBJECT` |

Một giáo viên có thể vừa là GVCN vừa là GVBM. Quyền được cộng dồn theo các assignment **active** tại thời điểm gọi API, nhưng không vượt phạm vi từng assignment.

---

## 3. Ma trận quyền theo role

### ADMIN

- Quản lý tài khoản (`/users`): CRUD, reset password.
- Quản lý role/permission.
- Xem nhật ký hệ thống (`/audit-logs`).
- Xem và cập nhật tham số hệ thống (`/system-parameters`).
- Bypass dev: ADMIN có thể xem hầu hết dữ liệu để debug, nhưng **không phải actor nghiệp vụ học vụ**.

### Giáo vụ (`ACADEMIC_STAFF`)

- Quản lý học sinh: CRUD, phân lớp, chuyển lớp.
- Quản lý lớp, năm học, học kỳ, khối, môn học, giáo viên.
- Phân công GVCN/GVBM (`/teacher-assignments`).
- Tạo và xem bảng điểm toàn trường.
- **Khóa bảng điểm** (`POST /scores/sheets/:id/lock`) — chỉ role này được phép theo business rule.
- **Duyệt / từ chối yêu cầu sửa điểm** (`approve`, `reject`) — chỉ role này được phép theo business rule.
- Chốt kết quả học kỳ (`POST /semesters/:id/finalize`).
- Tổng kết năm học (`POST /school-years/:id/year-end`).
- Chốt hạnh kiểm (`POST /conduct-assessments/:id/finalize`).
- Xem tất cả báo cáo toàn trường.
- Import học sinh, import điểm.
- Quản lý thời khóa biểu.
- Xem nhật ký hệ thống.

### BGH / Manager (`MANAGER`)

- Xem dữ liệu và báo cáo toàn trường (read-only).
- Xem dashboard summary.
- Xem danh sách học sinh, lớp, giáo viên, phân công.
- Xem tham số hệ thống (không sửa).
- **Không** nhập điểm, không phân lớp, không chuyển lớp, không khóa bảng điểm.

### TEACHER (vai trò thay đổi theo TeacherAssignment)

**Quyền chung của TEACHER:**

- Xem thời khóa biểu cá nhân (`GET /timetable/my`).
- Xem danh sách phân công của mình (`GET /me/teacher-assignments`).
- Xem yêu cầu sửa điểm do mình gửi.
- Xem hồ sơ học sinh thuộc lớp mình liên quan.

**GVCN (HOMEROOM):**

- Xem danh sách học sinh lớp chủ nhiệm.
- Xem hồ sơ học sinh lớp chủ nhiệm.
- Xem tất cả bảng điểm của lớp chủ nhiệm (bao gồm môn không dạy).
- Xem báo cáo lớp chủ nhiệm.
- Tạo và nộp hạnh kiểm lớp chủ nhiệm.
- **Không khóa bảng điểm**, không duyệt yêu cầu sửa điểm.
- **Không nhập/sửa điểm** nếu không đồng thời là GVBM của môn đó.

**GVBM (SUBJECT):**

- Xem học sinh lớp/môn được phân công.
- Nhập/sửa điểm đúng lớp/môn/học kỳ khi bảng điểm còn `DRAFT` hoặc `SUBMITTED`.
- Submit bảng điểm (`POST /scores/sheets/:id/submit`).
- Tạo yêu cầu sửa điểm khi bảng điểm đã `LOCKED`.
- Xem báo cáo môn mình dạy.
- **Không** xem/sửa điểm môn khác.
- **Không khóa bảng điểm**, không duyệt yêu cầu sửa điểm.

### STUDENT

- Chỉ xem hồ sơ của chính mình (`GET /students/:id` — backend kiểm tra).
- Xem điểm cá nhân (`GET /scores/my-scores`).
- Xem báo cáo học kỳ cá nhân (`GET /reports/student-semester/:studentId`).
- Xem thời khóa biểu cá nhân (`GET /timetable/my`).
- Tải phiếu điểm PDF (`GET /reports/student-transcript/:studentId/pdf`).
- **Không** xem dữ liệu của học sinh khác.

---

## 4. PermissionScopeService

Backend tập trung logic kiểm tra quyền theo scope tại `backend/src/authorization/permission-scope.service.ts`:

```ts
canViewClassStudents(user, classId)
canViewStudentProfile(user, studentId)
canViewStudentScores(user, studentId)
canViewClassScores(user, classId)
canEditSubjectScore(user, classId, subjectId, semesterId, scoreSheetStatus)
canSubmitScoreSheet(user, classId, subjectId, semesterId)
canLockScoreSheet(user)          // → chỉ ACADEMIC_STAFF
canApproveScoreChangeRequest(user) // → chỉ ACADEMIC_STAFF
canViewScoreChangeRequest(user, requestId)

isHomeroomTeacherOfClass(teacherId, classId, schoolYearId)
isSubjectTeacherOfClass(teacherId, classId, subjectId, semesterId)
getTeacherByUserId(userId)
```

Helper query scope:

```ts
classScopeWhereForUser(user)
studentScopeWhereForUser(user, requestedClassId?)
```

---

## 5. Bảng điểm và yêu cầu sửa điểm

| Thao tác | Role được phép | Ghi chú |
|---|---|---|
| Tạo bảng điểm | `ACADEMIC_STAFF`, `TEACHER` | TEACHER phải có SUBJECT assignment đúng lớp/môn/HK |
| Nhập/sửa điểm | `ACADEMIC_STAFF`, `TEACHER` | TEACHER chỉ trong phạm vi SUBJECT assignment; không sửa khi LOCKED |
| Submit bảng điểm | `ACADEMIC_STAFF`, `TEACHER` | Bảng điểm phải đủ MIDTERM + FINAL |
| **Khóa bảng điểm** | **`ACADEMIC_STAFF`** | Business rule: chỉ Giáo vụ được khóa |
| Unlock | `ACADEMIC_STAFF` | Trường hợp ngoại lệ — không phải workflow thông thường |
| Tạo yêu cầu sửa điểm | `TEACHER` | Bắt buộc bảng điểm LOCKED + có SUBJECT assignment đúng |
| **Duyệt / từ chối SCR** | **`ACADEMIC_STAFF`** | Business rule: chỉ Giáo vụ được duyệt |

> **Chú ý triển khai:** Controller hiện tại có `@Roles('ACADEMIC_STAFF', 'TEACHER')` cho `lock` và `approve`/`reject`. Tuy nhiên, service bên trong (`canLockScoreSheet`, `canApproveScoreChangeRequest`) phải enforce thêm điều kiện chỉ ACADEMIC_STAFF được thực hiện. Business rule theo AGENTS.md là nguồn sự thật cho phân quyền này.

---

## 6. Lỗi phân quyền

Các hàm `can...` trong `PermissionScopeService` ném `ForbiddenException` với errorKey:

| errorKey | Ý nghĩa |
|---|---|
| `FORBIDDEN` | Không có quyền chung |
| `NOT_HOMEROOM_TEACHER` | Không phải GVCN của lớp |
| `NOT_SUBJECT_TEACHER` | Không phải GVBM của lớp/môn/HK này |
| `NOT_STUDENT_OWNER` | Student đang cố xem dữ liệu của người khác |
| `SCORE_SHEET_LOCKED` | Bảng điểm đã khóa, không sửa trực tiếp |
| `ONLY_ACADEMIC_STAFF_CAN_APPROVE` | Chỉ Giáo vụ được duyệt/từ chối SCR |
