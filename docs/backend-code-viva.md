# Backend Code Viva – Student Management System SE104

> Bộ câu hỏi vấn đáp tập trung vào **code thật** trong repo.  
> Mỗi đáp án chỉ rõ file, class, method, DTO, Prisma model hoặc exception liên quan.  
> Các chỗ đánh dấu **⚠ Cần kiểm tra lại docs** là nơi `docs/viva-prep.md` mô tả sai hoặc thiếu so với code.

---

## Nhóm 1 – Bootstrap / main.ts / AppModule

**Q1. Server lắng nghe ở port nào? Đọc ở đâu trong code?**

`backend/src/main.ts` – dòng cuối gọi `app.listen(process.env.PORT ?? 3000)`.  
Nếu biến môi trường `PORT` không tồn tại thì mặc định là **3000**.

---

**Q2. Global prefix của toàn bộ API là gì? Được đặt ở đâu?**

`backend/src/main.ts` – `app.setGlobalPrefix('api/v1')`.  
Mọi endpoint đều có dạng `/api/v1/...` (ví dụ `/api/v1/auth/login`).

---

**Q3. ValidationPipe được cấu hình với tuỳ chọn gì? Tác dụng của từng tuỳ chọn?**

`backend/src/main.ts`:
```ts
new ValidationPipe({ whitelist: true, transform: true })
```
- `whitelist: true` – tự động xoá các field không khai báo trong DTO (bảo vệ chống over-posting).  
- `transform: true` – tự động ép kiểu (ví dụ query string `"5"` → số `5`) nếu DTO dùng `@Type(() => Number)`.

---

**Q4. CORS được cấu hình cho origin nào? Đặt ở đâu?**

`backend/src/main.ts` – `app.enableCors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true })`.  
Chỉ cho phép frontend dev server của Vite (React). Nếu deploy production cần cập nhật origin này.

---

**Q5. Swagger UI truy cập ở đường dẫn nào? Được khởi tạo trong file nào?**

`backend/src/main.ts` – `SwaggerModule.setup('api', app, documentFactory)`.  
Truy cập tại `http://localhost:3000/api`. Bearer token được thêm bằng `.addBearerAuth()`.

---

**Q6. AppModule import bao nhiêu feature module? Liệt kê một số module quan trọng.**

`backend/src/app.module.ts` – khoảng **23 module** được import, bao gồm:  
`PrismaModule`, `AuthModule`, `StudentsModule`, `EnrollmentsModule`, `ScoresModule`,  
`ScoreChangeRequestsModule`, `ReportsModule`, `ImportModule`, `AuditLogModule`,  
`AuthorizationModule`, `TeacherAssignmentsModule`, `NotificationsModule`.

---

**Q7. Nếu muốn thêm module `AttendanceModule`, phải sửa file nào trước tiên?**

Phải thêm `AttendanceModule` vào mảng `imports` trong `backend/src/app.module.ts`.  
Sau đó tạo `backend/src/attendance/attendance.module.ts` và đăng ký controller/service trong đó.

---

## Nhóm 2 – Auth / JWT

**Q8. Request `POST /api/v1/auth/login` đi vào controller nào, method nào?**

`backend/src/auth/auth.controller.ts` – class `AuthController`, method `login(@Body() loginDto: LoginDto)`.  
Method này gọi `this.authService.login(loginDto.username, loginDto.password)`.

---

**Q9. Trong `AuthService.login()`, điều kiện nào khiến throw `UnauthorizedException`?**

`backend/src/auth/auth.service.ts` – method `login()`:
1. Không tìm thấy user theo username (`user == null`).  
2. User tồn tại nhưng `user.status !== 'ACTIVE'`.  
3. `bcrypt.compare(password, user.passwordHash)` trả về `false`.  
Message: `'Sai tài khoản hoặc mật khẩu'` (không phân biệt case nào sai để tránh enumeration attack).

---

**Q10. JWT payload chứa những field nào? Được định nghĩa ở đâu?**

`backend/src/auth/types.ts` – interface `JwtPayload`:
```ts
{ sub: number; username: string; role: string; }
```
`sub` là `user.id` (số nguyên). `role` là tên role (ví dụ `'ADMIN'`).

---

**Q11. JWT secret lấy từ đâu? Nếu không có biến môi trường thì sao?**

`backend/src/auth/constants.ts`:
```ts
export const jwtConstants = { secret: process.env.JWT_SECRET || 'dev-secret-key' }
```
Nếu không có `JWT_SECRET` thì dùng `'dev-secret-key'` – **không an toàn cho production**.

---

**Q12. Token hết hạn sau bao lâu? Giá trị được set ở đâu?**

Hai chỗ:
- `backend/src/auth/constants.ts` – `expiresIn: '8h'` (dùng khi sign token).  
- `backend/src/auth/auth.service.ts` – response trả về `expiresIn: 8 * 60 * 60` (28800 giây).

---

**Q13. JwtStrategy validate() làm gì? Có query database không?**

`backend/src/auth/jwt.strategy.ts` – method `validate(payload: JwtPayload)`:
- Gọi `this.usersService.findById(payload.sub)` → **query DB** để lấy user mới nhất.  
- Kiểm tra `user.status !== 'ACTIVE'` → throw `UnauthorizedException` nếu tài khoản bị khoá sau khi login.  
- Trả về `AuthenticatedUser` (được gán vào `request.user`).

---

**Q14. Token được extract từ đâu trong request?**

`backend/src/auth/jwt.strategy.ts` – constructor:
```ts
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```
Lấy từ header `Authorization: Bearer <token>`.

---

**Q15. `GET /auth/me` trả về gì? Ai được gọi endpoint này?**

`backend/src/auth/auth.controller.ts` – method `me(@CurrentUser() user: AuthenticatedUser)`.  
Trả về `user` object đã được inject từ JWT (không query DB thêm).  
Yêu cầu `@UseGuards(JwtAuthGuard)` – bất kỳ role nào có token hợp lệ đều gọi được.

---

**Q16. `AuthenticatedUser` interface có những field nào?**

`backend/src/auth/types.ts`:
```ts
{ id, username, email, fullName, role, studentId: number|null, teacherId: number|null }
```
`studentId` và `teacherId` là nullable – chỉ có giá trị nếu user được liên kết với Student/Teacher profile.

---

## Nhóm 3 – Guards / Roles / PermissionScopeService

**Q17. `JwtAuthGuard` được định nghĩa ở đâu? Kế thừa từ class nào?**

`backend/src/common/guards/jwt-auth.guard.ts`:
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```
Kế thừa Passport `AuthGuard('jwt')` – tự động gọi `JwtStrategy.validate()`.

---

**Q18. `RolesGuard` làm gì khi endpoint không có decorator `@Roles`?**

`backend/src/common/guards/roles.guard.ts` – method `canActivate()`:
```ts
if (!roles || roles.length === 0) return true;
```
Nếu không có metadata `roles` thì guard cho qua (không restrict role).

---

**Q19. Role alias `GIAOVU` và `BGH` được xử lý ở đâu? Map sang gì?**

`backend/src/common/guards/roles.guard.ts`:
```ts
const ROLE_ALIASES: Record<string, string> = { GIAOVU: 'ACADEMIC_STAFF', BGH: 'MANAGER' };
```
Hàm `normalizeRole()` dùng map này trước khi so sánh, nên `@Roles('GIAOVU')` tương đương `@Roles('ACADEMIC_STAFF')`.

---

**Q20. `@Roles(...)` decorator được định nghĩa ở đâu? Dùng cơ chế gì của NestJS?**

`backend/src/common/decorators/roles.decorator.ts`:
```ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```
Dùng `SetMetadata` để gán metadata lên handler/class. `RolesGuard` đọc lại bằng `Reflector.getAllAndOverride`.

---

**Q21. `@CurrentUser()` decorator lấy dữ liệu từ đâu? File nào định nghĩa?**

`backend/src/common/decorators/current-user.decorator.ts`:
```ts
const request = ctx.switchToHttp().getRequest();
return request.user;
```
`request.user` được gán bởi `JwtAuthGuard` sau khi `JwtStrategy.validate()` chạy thành công.

---

**Q22. `PermissionScopeService` nằm ở đâu? Khác gì `RolesGuard`?**

`backend/src/authorization/permission-scope.service.ts`.  
- `RolesGuard` chỉ kiểm tra **role** (thô): ADMIN, TEACHER, v.v.  
- `PermissionScopeService` kiểm tra **quan hệ dữ liệu**: ví dụ giáo viên có phải GVCN của lớp đó không, có phải GVBM môn đó không – cần query DB.

---

**Q23. Method nào trong `PermissionScopeService` check xem giáo viên có phải GVCN của lớp không?**

`backend/src/authorization/permission-scope.service.ts` – method:
```ts
isHomeroomTeacherOfClass(teacherId: number, classId: number, schoolYearId: number): Promise<boolean>
```
Query Prisma bảng `TeacherAssignment` với `assignmentType: 'HOMEROOM'`.

---

**Q24. Method nào build Prisma WHERE để filter danh sách học sinh theo quyền user?**

`backend/src/authorization/permission-scope.service.ts` – method `studentScopeWhereForUser(user)`:
- ADMIN/ACADEMIC_STAFF/MANAGER: `{}` (xem tất cả).  
- TEACHER: `{ enrollments: { some: { classId: { in: teacherClassIds } } } }`.  
- STUDENT: `{ id: user.studentId }` (chỉ xem bản thân).

---

**Q25. `canEditSubjectScore()` kiểm tra những điều kiện gì?**

`backend/src/authorization/permission-scope.service.ts` – method `canEditSubjectScore()`:
1. ScoreSheet phải không ở trạng thái `LOCKED`.  
2. User là ACADEMIC_STAFF **hoặc** là GVBM môn đó trong kỳ đó (`isSubjectTeacherOfClass()`).  
Throw `ForbiddenException` nếu không thoả.

---

**Q26. `AuthorizationService` khác `PermissionScopeService` ở chỗ nào?**

`backend/src/authorization/authorization.service.ts`:
```ts
export class AuthorizationService extends PermissionScopeService {}
```
`AuthorizationService` chỉ extend để tận dụng DI của NestJS – không thêm logic nào.  
Các service khác inject `AuthorizationService` thay vì `PermissionScopeService` trực tiếp.

---

## Nhóm 4 – DTO Validation

**Q27. `LoginDto` validate những field nào? File nào chứa DTO này?**

`backend/src/auth/dto/login.dto.ts`:
- `username`: `@IsString()` + `@IsNotEmpty()`.  
- `password`: `@IsString()` + `@IsNotEmpty()`.  
Không dùng `@MinLength` nên password ngắn vẫn pass validation.

---

**Q28. `CreateStudentDto` có field nào là optional? File nào?**

`backend/src/students/dto/create-student.dto.ts`:
- **Bắt buộc**: `studentCode`, `fullName`, `gender`, `dateOfBirth`, `admissionDate`.  
- **Optional**: `address`, `email`, `status`, `note`.  
`status` optional vì service tự gán default `'PENDING_CLASS_ASSIGNMENT'`.

---

**Q29. Nếu gửi thêm field `hackerField: "evil"` trong body `POST /students`, chuyện gì xảy ra?**

`ValidationPipe` được cấu hình `whitelist: true` trong `main.ts`.  
Field `hackerField` sẽ **bị xoá** trước khi vào service – không ném lỗi nhưng field đó không có trong DTO.

---

**Q30. `AssignEnrollmentDto` dùng decorator gì để ép kiểu string → number cho query params?**

`backend/src/enrollments/dto/assign-enrollment.dto.ts`:
```ts
@Type(() => Number) @IsInt() studentId: number;
```
`@Type(() => Number)` là của `class-transformer`, phối hợp với `transform: true` trong `ValidationPipe`.

---

**Q31. `CreateTeacherAssignmentDto` field `assignmentType` validate bằng decorator nào?**

`backend/src/teacher-assignments/dto/create-teacher-assignment.dto.ts`:
```ts
@IsEnum(TeacherAssignmentType) assignmentType: 'HOMEROOM' | 'SUBJECT';
```
Dùng `@IsEnum()` – chỉ accept đúng hai giá trị này, không phân biệt hoa thường (mặc định case-sensitive).

---

**Q32. Nếu muốn thêm validate `email` format trong `CreateStudentDto`, thêm gì?**

Thêm `@IsEmail()` decorator từ `class-validator` vào field `email` trong  
`backend/src/students/dto/create-student.dto.ts`.  
Field `email` vẫn là `@IsOptional()` nên chỉ validate khi field có giá trị.

---

## Nhóm 5 – Prisma Schema / Migration

**Q33. Bảng `ScoreSheet` có unique constraint nào trong schema?**

`backend/prisma/schema.prisma` – model `ScoreSheet`:
```prisma
@@unique([classId, subjectId, semesterId])
```
Đảm bảo mỗi tổ hợp (lớp, môn, kỳ) chỉ có **một** bảng điểm.

---

**Q34. Trạng thái của `ScoreSheet` được định nghĩa bằng enum nào? Các giá trị?**

`backend/prisma/schema.prisma`:
```prisma
enum ScoreSheetStatus { DRAFT, SUBMITTED, LOCKED, NEEDS_CORRECTION }
```
Flow: `DRAFT` → `SUBMITTED` → `LOCKED` (có thể → `NEEDS_CORRECTION` → `SUBMITTED` lại).

---

**Q35. `TeacherAssignment` phân biệt GVCN và GVBM bằng cách nào trong schema?**

Field `assignmentType` kiểu `TeacherAssignmentType`:
```prisma
enum TeacherAssignmentType { HOMEROOM, SUBJECT }
```
- `HOMEROOM`: `subjectId` là null, `semesterId` là null (phân công cả năm học).  
- `SUBJECT`: `subjectId` và `semesterId` bắt buộc có giá trị.

---

**Q36. `StudentClassEnrollment` có unique constraint nào? Ý nghĩa?**

`backend/prisma/schema.prisma`:
```prisma
@@unique([scoreSheetId, studentId])
```
⚠ **Cần kiểm tra lại docs** – unique thực tế trên model `StudentSubjectScore` là `@@unique([scoreSheetId, studentId])`, còn `StudentClassEnrollment` không có composite unique tương tự.  
Trong `StudentClassEnrollment` chỉ có `@@index([studentId])`, không phải unique constraint trực tiếp – kiểm tra migration để xác nhận.

---

**Q37. Model `ScoreDetail` lưu gì? Quan hệ với bảng nào?**

`backend/prisma/schema.prisma` – `ScoreDetail`:
- Thuộc về `StudentSubjectScore` (1 điểm môn → nhiều điểm thành phần).  
- Có `testTypeId` (loại bài kiểm tra), `attemptNo` (lần 1, 2, ...), `score`, `weightSnapshot`.  
- Unique: `@@unique([studentSubjectScoreId, testTypeId, attemptNo])`.  
`weightSnapshot` lưu hệ số tại thời điểm nhập để giữ lịch sử kể cả khi hệ số thay đổi sau.

---

**Q38. Bảng `AuditLog` lưu những cột nào? `oldValue`/`newValue` kiểu gì?**

`backend/prisma/schema.prisma` – `AuditLog`:
`id, userId?, action, entityType, entityId?, oldValue?, newValue?, ipAddress?, createdAt`.  
`oldValue` và `newValue` là `String?` – service serialize object thành JSON string trước khi lưu  
(xem `backend/src/common/audit-log/audit-log.service.ts` method `log()`).

---

**Q39. Nếu muốn chạy migration mới sau khi sửa schema, chạy lệnh gì?**

```bash
npx prisma migrate dev --name <tên_migration>
```
Lệnh này: (1) tạo file SQL trong `prisma/migrations/`, (2) apply vào DB, (3) regenerate Prisma Client.  
Chạy từ thư mục `backend/`.

---

**Q40. `SystemParameter` liên kết với bảng nào? Dùng để làm gì trong code?**

`backend/prisma/schema.prisma` – `SystemParameter` có `schoolYearId` unique.  
Trong `backend/src/students/students.service.ts`, service đọc `minAge`/`maxAge` từ `SystemParameter`  
để validate tuổi học sinh khi tạo mới hoặc cập nhật.

---

## Nhóm 6 – Students / Enrollments

**Q41. `GET /students` đi vào method nào? Ai có quyền gọi?**

`backend/src/students/students.controller.ts` – method `findAll(@Query() query: StudentQueryDto, @CurrentUser() user)`.  
Guard: `@Roles(...VIEW_ACADEMIC_ROLES)` = `['ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER', 'STUDENT']`.  
Tức là tất cả role đều gọi được nhưng kết quả bị filter theo scope.

---

**Q42. Khi STUDENT gọi `GET /students`, họ thấy gì? Logic lọc ở đâu?**

`backend/src/authorization/permission-scope.service.ts` – method `studentScopeWhereForUser(user)`:
```ts
// role STUDENT
return { id: user.studentId };
```
Chỉ trả về bản thân. Logic này được gọi từ `StudentsService.findAll()`.

---

**Q43. `StudentsService.create()` validate tuổi như thế nào? File nào?**

`backend/src/students/students.service.ts` – method `create()`:
1. Load `SystemParameter` của năm học hiện tại → lấy `minAge`, `maxAge`.  
2. Tính tuổi dựa trên `dateOfBirth` và `admissionDate`.  
3. Nếu tuổi < `minAge` hoặc > `maxAge` → throw `BadRequestException`.

---

**Q44. `DELETE /students/:id` có xoá cứng không? Điều kiện để xoá mềm?**

`backend/src/students/students.service.ts` – method `remove(id)`:
- Nếu học sinh **có** enrollment hoặc điểm liên quan → `status = 'INACTIVE'` (soft delete).  
- Nếu học sinh **không** có dữ liệu liên quan → `prisma.student.delete()` (hard delete).

---

**Q45. `POST /enrollments/assign` làm gì? Kiểm tra điều kiện gì trước khi tạo enrollment?**

`backend/src/enrollments/enrollments.service.ts` – method `assign(dto, user)`:
1. Học sinh tồn tại.  
2. Lớp tồn tại và chưa đầy (`currentSize < maxSize`).  
3. Học sinh chưa có enrollment ACTIVE trong cùng kỳ học.  
Sau đó: transaction tạo `StudentClassEnrollment`, cập nhật `class.currentSize`, cập nhật `student.status = 'ACTIVE'`.

---

**Q46. `POST /enrollments/transfer` khác `assign` thế nào? Validate gì thêm?**

`backend/src/enrollments/enrollments.service.ts` – method `transfer(dto, user)`:
- Thêm kiểm tra: **cấp lớp (gradeLevel)** của lớp cũ và lớp mới phải trùng nhau (không được chuyển từ lớp 10 sang lớp 11).  
- Transaction: set enrollment cũ `status = 'TRANSFERRED'` + gán `endedAt`, tạo enrollment mới `ACTIVE`.  
- Cập nhật `currentSize` của **cả hai lớp**.

---

**Q47. Khi TEACHER gọi `GET /enrollments`, họ thấy những enrollment nào?**

`backend/src/enrollments/enrollments.service.ts` – method `scopeWhere(user)`:
```ts
// role TEACHER
{ class: { assignments: { some: { teacherId: user.teacherId, isActive: true } } } }
```
Chỉ thấy enrollment trong các lớp mà giáo viên đó có phân công (HOMEROOM hoặc SUBJECT).

---

**Q48. Nếu bug: assign bị lỗi "lớp đã đầy" dù lớp còn chỗ, cần debug ở đâu?**

Kiểm tra:
1. `backend/src/enrollments/enrollments.service.ts` – logic đếm `ACTIVE` enrollments so với `class.maxSize`.  
2. `backend/prisma/schema.prisma` – `Class.currentSize` có bị lệch không (không được sync đúng sau transfer).  
3. Chạy query kiểm tra `currentSize` trong DB vs số enrollment ACTIVE thực tế.

---

## Nhóm 7 – TeacherAssignment

**Q49. `POST /teacher-assignments` ai được gọi? Method service nào xử lý?**

`backend/src/teacher-assignments/teacher-assignments.controller.ts` – guard `@Roles('ACADEMIC_STAFF')`.  
Service: `backend/src/teacher-assignments/teacher-assignments.service.ts` – method `create(dto)`.

---

**Q50. Khi tạo phân công HOMEROOM, service validate gì?**

`backend/src/teacher-assignments/teacher-assignments.service.ts` – method `create(dto)`:
1. `subjectId` phải là null/undefined.  
2. Lớp đó chưa có phân công HOMEROOM `isActive = true` trong cùng `schoolYearId`.  
Nếu đã có → throw `ConflictException`.

---

**Q51. Khi tạo phân công SUBJECT, validate gì thêm ngoài HOMEROOM?**

`backend/src/teacher-assignments/teacher-assignments.service.ts`:
1. `subjectId` bắt buộc.  
2. `semesterId` bắt buộc và semester phải thuộc `schoolYearId` đã chỉ định.  
3. Không tồn tại phân công SUBJECT trùng (teacherId + classId + subjectId + semesterId + isActive = true).

---

**Q52. `GET /me/teacher-assignments` chỉ dành cho ai? Lấy data như thế nào?**

`backend/src/teacher-assignments/teacher-assignments.controller.ts` – guard `@Roles('TEACHER')`.  
Service gọi `findMine(user)` → query `TeacherAssignment` với `teacherId = user.teacherId`.  
Giáo viên chỉ thấy phân công của chính mình.

---

**Q53. Include pattern khi lấy teacher assignment trả về những relation nào?**

`backend/src/teacher-assignments/teacher-assignments.service.ts` – `ASSIGNMENT_INCLUDE`:
```ts
{
  teacher: { include: { subject, user: { select: { id, username, email, status } } } },
  class: { include: { gradeLevel, schoolYear } },
  subject: true, schoolYear: true, semester: true
}
```

---

**Q54. Nếu muốn thêm tính năng: một lớp có nhiều GVCN (co-homeroom), cần sửa những file nào?**

1. `backend/prisma/schema.prisma` – bỏ unique constraint "1 HOMEROOM per class per year" trong TeacherAssignment, hoặc thêm field `isPrimary`.  
2. `backend/src/teacher-assignments/teacher-assignments.service.ts` – sửa logic `create()` validate HOMEROOM.  
3. `backend/src/authorization/permission-scope.service.ts` – sửa `isHomeroomTeacherOfClass()` nếu logic thay đổi.  
4. `backend/prisma/migrations/` – tạo migration mới.

---

## Nhóm 8 – Scores

**Q55. `GET /scores/sheets` ai được gọi? Lọc theo quyền ở đâu?**

`backend/src/scores/scores.controller.ts` – guard `@Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER')`.  
Service `ScoresService.findSheets()` gọi `buildSheetWhere(query, user)` để tạo Prisma WHERE dựa trên role.  
TEACHER chỉ thấy sheet của lớp/môn mình dạy.

---

**Q56. `POST /scores/sheets` dùng Prisma upsert – tại sao không dùng create?**

`backend/src/scores/scores.service.ts` – method `createSheet()`:
```ts
prisma.scoreSheet.upsert({ where: { classId_subjectId_semesterId: ... }, update: {}, create: { ... } })
```
Tránh lỗi duplicate nếu GVBM bấm "Tạo bảng điểm" nhiều lần – idempotent operation.  
Unique key: `classId + subjectId + semesterId`.

---

**Q57. Chỉ GVBM mới được nhập điểm – điều kiện này check ở đâu?**

`backend/src/authorization/permission-scope.service.ts` – method `canEditSubjectScore(user, classId, subjectId, semesterId, status)`:
```ts
await this.isSubjectTeacherOfClass(teacherId, classId, subjectId, semesterId)
```
Được gọi trong `ScoresService` trước khi update điểm.

---

**Q58. Luồng trạng thái bảng điểm: từ DRAFT đến LOCKED đi qua bước nào?**

1. `DRAFT` – GVBM tạo sheet, nhập điểm.  
2. `SUBMITTED` – GVBM/ACADEMIC_STAFF submit (`POST /scores/sheets/:id/submit`).  
3. `LOCKED` – ACADEMIC_STAFF lock (`POST /scores/sheets/:id/lock`).  
4. Nếu cần sửa sau khi LOCKED → `ScoreChangeRequest` → khi approve, điểm được cập nhật trực tiếp (sheet vẫn LOCKED).  
`NEEDS_CORRECTION` là trạng thái khi sheet bị trả về để sửa thêm.

---

**Q59. `PUT /scores/sheets/:id/students/:studentId` cập nhật điểm ở bảng nào trong Prisma?**

Cập nhật bảng `ScoreDetail` (điểm thành phần) và sau đó recalculate `StudentSubjectScore.averageScore`.  
Model liên quan: `ScoreDetail`, `StudentSubjectScore`, `ScoreSheet`.

---

**Q60. `GET /scores/my-scores` chỉ dành cho role nào? Lấy data gì?**

`backend/src/scores/scores.controller.ts` – guard `@Roles('STUDENT')`.  
Method `getMyScores(@CurrentUser() user)` → lấy tất cả `StudentSubjectScore` của `user.studentId`.  
Học sinh chỉ thấy điểm của bản thân.

---

**Q61. `GET /scores/sheets/:id/pdf` trả về gì? Ai có quyền?**

`backend/src/scores/scores.controller.ts` – guard `@Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER')`.  
Export bảng điểm ra file PDF, trả về `Response` stream với `Content-Type: application/pdf`.

---

**Q62. Nếu bug: điểm trung bình tính sai, cần debug ở đâu?**

`backend/src/scores/scores.service.ts` – tìm method tính `averageScore` cho `StudentSubjectScore`.  
Kiểm tra `ScoreDetail.weightSnapshot` có đúng hệ số không, công thức tính trung bình có đúng theo loại bài kiểm tra không.  
Bảng `TestType.defaultWeight` và `ScoreWeight.weight` trong schema là nguồn hệ số.

---

## Nhóm 9 – ScoreChangeRequests

**Q63. Ai được tạo `ScoreChangeRequest`? Check ở đâu?**

`backend/src/score-change-requests/score-change-requests.controller.ts` – guard `@Roles('TEACHER')`.  
Thêm check trong `backend/src/score-change-requests/score-change-requests.service.ts` – method `create()`:
```ts
if (user.role !== 'TEACHER' || !user.teacherId) throw new ForbiddenException(...)
```

---

**Q64. Điều kiện nào để tạo được `ScoreChangeRequest`? Throw exception gì nếu không thoả?**

`backend/src/score-change-requests/score-change-requests.service.ts` – method `create()`:
1. `scoreSheet.status === 'LOCKED'` → nếu không: `BadRequestException` với `errorKey: 'SCORE_SHEET_LOCKED'`.  
2. ScoreSheet phải tồn tại → nếu không: `NotFoundException`.  
3. User phải là GVBM của sheet đó.

---

**Q65. Ai được approve `ScoreChangeRequest`? Guard cho phép role nào nhưng business logic restrict thế nào?**

`backend/src/score-change-requests/score-change-requests.controller.ts` – guard `@Roles('ACADEMIC_STAFF', 'TEACHER')`.  
Nhưng trong `backend/src/authorization/permission-scope.service.ts` – method `canApproveScoreChangeRequest(user)`:
```ts
return this.canManageAcademicWorkflow(user); // chỉ ADMIN, ACADEMIC_STAFF
```
TEACHER có role pass guard nhưng sẽ bị `ForbiddenException` trong service.

---

**Q66. Khi approve request, transaction thực hiện những gì?**

`backend/src/score-change-requests/score-change-requests.service.ts` – method `approve()`, transaction:
1. Update `ScoreDetail.score = newScore`.  
2. Recalculate `StudentSubjectScore.averageScore`.  
3. Update `ScoreChangeRequest.status = 'APPROVED'`, gán `reviewedById`, `reviewedAt`, `reviewNote`.

---

**Q67. `oldScore` và `newScore` được lưu ở bảng nào? Tại sao cần lưu cả hai?**

Bảng `ScoreChangeRequest` trong `backend/prisma/schema.prisma`, fields `oldScore` và `newScore`.  
Cần lưu cả hai để: audit trail (biết điểm đã từng là bao nhiêu), có thể reject và giữ `oldScore` nguyên.

---

**Q68. Nếu request đã ở trạng thái `APPROVED` mà gọi approve lại, exception nào được throw?**

`backend/src/score-change-requests/score-change-requests.service.ts` – method `approve()`:
```ts
if (request.status !== 'PENDING') throw new ConflictException('Yêu cầu đã được xử lý')
```

---

## Nhóm 10 – Reports

**Q69. `GET /reports/class-semester` bắt buộc query params gì? Thiếu thì sao?**

`backend/src/reports/reports.controller.ts` → `ReportsService.getClassSemesterReport(query, user)`:
```ts
if (!query.classId || !query.semesterId) throw new BadRequestException('classId và semesterId là bắt buộc')
```

---

**Q70. `GET /reports/dashboard-summary` ai được gọi?**

`backend/src/reports/reports.controller.ts` – guard:
```ts
@Roles('ADMIN', 'ACADEMIC_STAFF', 'MANAGER')
```
TEACHER và STUDENT **không** được gọi endpoint này.

---

**Q71. Report `class-semester` sử dụng `Promise.all` để fetch gì? Lợi ích?**

`backend/src/reports/reports.service.ts` – method `getClassSemesterReport()`:
```ts
const [classItem, params, sheets, enrollments] = await Promise.all([
  this.findClass(query.classId),
  this.getSemesterParameters(query.semesterId),
  this.getScoreSheets(...),
  this.prisma.studentClassEnrollment.findMany(...),
]);
```
4 query chạy song song → giảm latency tổng thể so với chạy tuần tự.

---

**Q72. `GET /reports/student-transcript/:studentId/pdf` – STUDENT có gọi được không?**

Có – `backend/src/reports/reports.controller.ts`:
```ts
@Roles('ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'STUDENT')
```
Nhưng cần kiểm tra trong service có permission scope check để student chỉ xem transcript của chính mình không.  
⚠ **Cần kiểm tra lại docs** – `viva-prep.md` không đề cập rõ điều kiện này.

---

**Q73. `buildStudentSemesterSummaries()` nhận input gì và trả về gì?**

`backend/src/reports/reports.service.ts`:
- Input: danh sách `Student[]`, danh sách `ScoreSheet[]`, `passSemesterScore` (số tối thiểu để đậu).  
- Output: mảng object với `semesterAverage`, `result: 'PASS' | 'FAIL'` cho từng học sinh.  
Logic tính trung bình kỳ và xếp kết quả dựa trên ngưỡng từ `SystemParameter`.

---

## Nhóm 11 – Import Excel

**Q74. Import học sinh gồm mấy bước API? Endpoint nào?**

Hai bước (two-step pattern):
1. `POST /students/import/preview` – upload file Excel, nhận lại `{ valid: [...], errors: [...] }`.  
2. `POST /students/import/commit` – gửi mảng data đã valid, tạo records trong DB.  
File: `backend/src/import/import.controller.ts`.

---

**Q75. `previewScoreImport()` validate học sinh thuộc lớp bằng cách nào? Dữ liệu lấy từ đâu?**

`backend/src/import/import.service.ts` – method `previewScoreImport()`:
```ts
const enrollments = await this.prisma.studentClassEnrollment.findMany({
  where: { classId: sheet.classId, semesterId: sheet.semesterId, status: 'ACTIVE' },
  include: { student: { select: { studentCode: true } } },
});
const enrolledCodes = new Set(enrollments.map(e => e.student.studentCode));
```
Validate dựa trên `StudentClassEnrollment` (học sinh đang enrolled trong lớp/kỳ), **không phụ thuộc** vào `StudentSubjectScore` đã có hay chưa.

---

**Q75b. `previewStudentImport()` đọc file Excel như thế nào? Method nào parse?**

`backend/src/import/import.service.ts` – method `parseXlsx<T>(buffer: Buffer)`:
Dùng thư viện `xlsx` (SheetJS) để đọc buffer thành mảng object.  
Header cột hỗ trợ cả tiếng Việt (`Mã HS`, `Họ tên`) và tiếng Anh (`studentCode`, `fullName`).

---

**Q76. Validation nào được thực hiện trong `previewStudentImport()`?**

`backend/src/import/import.service.ts`:
- `studentCode` không được trống.  
- `fullName` không được trống.  
- `gender` phải là `MALE/FEMALE/OTHER/NAM/NỮ`.  
- `dateOfBirth` phải parse được thành Date.  
- `studentCode` không được trùng với record đã có trong DB (query `prisma.student.findMany`).

---

**Q77. `commitScoreImport()` xử lý học sinh chưa có `StudentSubjectScore` như thế nào?**

`backend/src/import/import.service.ts` – method `commitScoreImport()`:
```ts
const ss = await this.prisma.studentSubjectScore.upsert({
  where: { scoreSheetId_studentId: { scoreSheetId: sheetId, studentId } },
  update: {},
  create: { scoreSheetId: sheetId, studentId },
});
```
Tự động **tạo mới** `StudentSubjectScore` nếu học sinh chưa có record, sau đó upsert `ScoreDetail` và tính lại `averageScore`.

---

**Q77b. `commitStudentImport()` nhận data từ đâu? Có phải upload file lần nữa không?**

`backend/src/import/import.controller.ts` – `commitStudentImport(@Body() body: { data: StudentImportRow[] })`.  
Nhận JSON array từ body – frontend gửi lại array `valid` từ bước preview. **Không cần upload file lần nữa**.

---

**Q78. Import điểm có preview không? Endpoint nào?**

Có – tương tự import học sinh:
1. `POST /scores/sheets/:id/import/preview` – upload Excel, nhận preview.  
2. `POST /scores/sheets/:id/import/commit` – commit data.  
File: `backend/src/import/import.controller.ts`.

---

**Q79. Template Excel cho học sinh tải về ở endpoint nào? Ai được tải?**

`backend/src/import/import.controller.ts`:
```ts
@Get('templates/students') @Roles('ADMIN', 'ACADEMIC_STAFF')
async studentTemplate(@Res() res: Response) { ... }
```
Trả về file `.xlsx` mẫu với header cột đúng định dạng.

---

**Q80. `FileInterceptor('file')` được dùng ở đâu? Giải thích tác dụng.**

`backend/src/import/import.controller.ts` – trên các method `previewStudentImport` và `previewScoreImport`:
```ts
@UseInterceptors(FileInterceptor('file'))
```
Interceptor của `@nestjs/platform-express` + `multer`: parse multipart/form-data, inject file vào `@UploadedFile() file: Express.Multer.File`.

---

## Nhóm 12 – AuditLog

**Q81. `AuditLogService.log()` lưu dữ liệu gì? File nào?**

`backend/src/common/audit-log/audit-log.service.ts` – method `log(entry: AuditLogEntry)`:
Lưu vào `prisma.auditLog.create()` với: `userId, action, entityType, entityId, oldValue (JSON string), newValue (JSON string), ipAddress`.

---

**Q82. `GET /audit-logs` ai được gọi? Có phân trang không?**

`backend/src/audit-logs/audit-logs.controller.ts` – guard `@Roles('ADMIN', 'ACADEMIC_STAFF')`.  
Service `AuditLogsService.findAll(query)` có phân trang:  
- `page` (default 1), `limit` (default 50, max 100).  
- `skip = (page - 1) * limit`.

---

**Q83. Có thể filter audit log theo những tiêu chí nào?**

`backend/src/audit-logs/audit-logs.service.ts` – method `findAll(query)`:
- `entityType` (exact match).  
- `entityId` (exact match).  
- `userId` (exact match).  
- `action` (contains, case-insensitive).  
- `from` / `to` (date range trên `createdAt`).

---

**Q84. `AuditLogEntry` interface có field `ipAddress` – field này đến từ đâu trong thực tế?**

`backend/src/common/audit-log/audit-log.service.ts` – interface `AuditLogEntry`:
```ts
ipAddress?: string;
```
Các service gọi `log()` phải tự truyền `ipAddress` vào. Thường lấy từ `request.ip` trong controller rồi pass xuống service.  
⚠ **Cần kiểm tra lại docs** – cần verify xem các service call hiện tại có pass `ipAddress` không hay để `undefined`.

---

**Q85. Nếu muốn thêm audit log cho `DELETE /students/:id`, cần sửa file nào?**

`backend/src/students/students.service.ts` – method `remove(id)`.  
Thêm `await this.auditLogService.log({ userId, action: 'DELETE', entityType: 'Student', entityId: id, oldValue: existingStudent })`.  
`AuditLogService` đã được inject sẵn nếu `AuditLogModule` được import (kiểm tra `StudentsModule`).

---

## Nhóm 13 – Debug / Build

**Q86. Khi chạy `npm run start:dev`, NestJS dùng chế độ gì? Watch file nào?**

Chạy `ts-node` với `--watch` (hoặc `nest start --watch`).  
Tự động restart khi thay đổi file `.ts` trong `backend/src/`.  
Config trong `backend/package.json`, script `start:dev`.

---

**Q87. Nếu Prisma Client bị lỗi "Cannot find module '@prisma/client'", cần chạy lệnh gì?**

```bash
npx prisma generate
```
Chạy từ thư mục `backend/`. Regenerate Prisma Client từ `schema.prisma`.

---

**Q88. Làm thế nào để seed database với dữ liệu mẫu?**

```bash
npx prisma db seed
```
Hoặc `npm run seed` nếu có script. File seed: `backend/prisma/seed.ts`.  
Config trong `backend/package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }`.

---

**Q89. Nếu lỗi `JWT_SECRET` không khớp giữa restart, token cũ có còn dùng được không?**

Không. JWT được sign bằng secret tại thời điểm tạo. Nếu secret thay đổi, tất cả token cũ **invalid**.  
User cần login lại. Secret lấy từ `process.env.JWT_SECRET` (`backend/src/auth/constants.ts`).

---

**Q90. Nếu `POST /auth/login` trả về 401 dù password đúng, debug ở đâu?**

`backend/src/auth/auth.service.ts` – method `login()`:
1. Kiểm tra `user.status !== 'ACTIVE'` – tài khoản bị inactive.  
2. Kiểm tra `bcrypt.compare()` – password hash có được lưu đúng không (`seed.ts` dùng `bcrypt.hash()`).  
3. Kiểm tra `usersService.findByUsername()` – có trả về đúng user không.

---

**Q91. Swagger không hiển thị endpoint mới thêm, nguyên nhân và cách fix?**

Nguyên nhân thường là controller chưa được đăng ký trong module, hoặc module chưa được import vào `AppModule`.  
Fix:  
1. Thêm controller vào `providers`/`controllers` của module tương ứng.  
2. Đảm bảo module được import trong `backend/src/app.module.ts`.

---

**Q92. Response của tất cả API được wrap trong format gì? Helper nào làm việc này?**

`backend/src/common/api-response.ts`:
```ts
export function successResponse<T>(data: T, message = 'Success') {
  return { data, message };
}
```
Format: `{ data: T, message: string }`.

---

## Nhóm 14 – Modify Feature (Thêm tính năng)

**Q93. Muốn thêm tính năng: phụ huynh (parent) xem điểm con. Cần sửa những gì?**

1. `backend/prisma/schema.prisma` – thêm model `Parent` và quan hệ với `Student`.  
2. `backend/prisma/seed.ts` – thêm role `PARENT` vào bảng `Role`.  
3. `backend/src/common/constants/roles.ts` – thêm `'PARENT'` vào `VIEW_ACADEMIC_ROLES`.  
4. `backend/src/authorization/permission-scope.service.ts` – thêm case `PARENT` trong các scope methods.  
5. `backend/src/scores/scores.controller.ts` – thêm `'PARENT'` vào `@Roles` của `getMyScores` (hoặc tạo endpoint riêng).  
6. Tạo migration mới.

---

**Q94. Muốn thêm endpoint `GET /students/export/excel`. Sửa file nào?**

1. `backend/src/students/students.controller.ts` – thêm method `exportExcel(@Res() res: Response)` với guard phù hợp.  
2. `backend/src/students/students.service.ts` – thêm method build Excel buffer (dùng thư viện `xlsx`).  
Không cần sửa module vì controller đã được đăng ký.

---

**Q95. Muốn thêm field `phone` cho `Student`. Cần sửa những file nào?**

1. `backend/prisma/schema.prisma` – thêm `phone String?` vào model `Student`.  
2. Chạy `npx prisma migrate dev --name add_student_phone`.  
3. `backend/src/students/dto/create-student.dto.ts` – thêm `@IsOptional() @IsString() phone?: string`.  
4. `backend/src/students/dto/update-student.dto.ts` – tương tự.  
5. `backend/src/students/students.service.ts` – đảm bảo `phone` được pass vào `prisma.student.create()`.

---

**Q96. Muốn lock không cho nhập điểm sau ngày X của học kỳ. Sửa ở đâu?**

`backend/src/authorization/permission-scope.service.ts` – method `canEditSubjectScore()`.  
Thêm logic: load `Semester` tương ứng, so sánh `new Date() > semester.endDate` → throw `ForbiddenException`.  
Hoặc thêm field `scoreDeadline` vào `Semester` model trong schema.

---

**Q97. Muốn giới hạn TEACHER chỉ xem report của lớp mình dạy. Sửa method nào?**

`backend/src/reports/reports.service.ts` – method `ensureCanViewClassReport(user, classId, semesterId)`.  
Thêm check: nếu `user.role === 'TEACHER'` thì gọi `permissionScope.canViewClassScores(user, classId)`.  
Nếu false → throw `ForbiddenException`.

---

**Q98. Muốn thêm pagination cho `GET /students`. Cần sửa gì?**

1. `backend/src/students/dto/student-query.dto.ts` – thêm `page?: number`, `limit?: number`.  
2. `backend/src/students/students.service.ts` – method `findAll()` thêm `skip = (page-1)*limit`, `take = limit`, trả về `{ total, items }`.  
3. `backend/src/students/students.controller.ts` – không cần sửa nhiều vì dùng `@Query() query: StudentQueryDto`.

---

**Q99. Muốn notify giáo viên khi có score change request mới được tạo. Sửa file nào?**

`backend/src/score-change-requests/score-change-requests.service.ts` – method `create()`, sau khi tạo request:
```ts
await this.notificationsService.create({ title: 'Yêu cầu sửa điểm mới', ... })
```
`NotificationsModule` đã có trong `AppModule`. Cần inject `NotificationsService` vào `ScoreChangeRequestsModule`.

---

**Q100. Muốn thêm soft-delete cho `TeacherAssignment`. Cần sửa gì?**

1. `backend/prisma/schema.prisma` – thêm `deletedAt DateTime?` vào `TeacherAssignment`.  
2. Migration mới.  
3. `backend/src/teacher-assignments/teacher-assignments.service.ts`:  
   - `remove()` hoặc `delete()`: set `deletedAt = new Date()` thay vì `prisma.teacherAssignment.delete()`.  
   - `findAll()`: thêm `where: { deletedAt: null }` vào query.  
4. `backend/src/authorization/permission-scope.service.ts` – `isHomeroomTeacherOfClass()` cũng cần filter `deletedAt: null`.

---

**Q101. `successResponse()` helper có phải là global interceptor không? Tại sao không?**

Không phải interceptor – đây là function thường gọi thủ công trong từng controller method.  
`backend/src/common/api-response.ts`. Nếu muốn tự động wrap, cần implement `NestInterceptor` và đăng ký global trong `main.ts`.

---

**Q102. Tại sao `scores.service.ts` dùng `upsert` cho ScoreSheet thay vì `create`?**

Vì ScoreSheet có unique key `(classId, subjectId, semesterId)`. Nếu dùng `create` và sheet đã tồn tại → Prisma throw `PrismaClientKnownRequestError` với code `P2002` (unique constraint violation).  
`upsert` idempotent: tạo mới nếu chưa có, không làm gì nếu đã có (`update: {}`).

---

**Q103. Trong seed.ts, password được hash thế nào? Tìm ở đâu?**

`backend/prisma/seed.ts`:
```ts
const hashedPassword = await bcrypt.hash('Admin@123', 10);
```
Salt rounds = 10. Dùng thư viện `bcryptjs` hoặc `bcrypt`. Khi login, `auth.service.ts` dùng `bcrypt.compare()` để verify.

---

**Q104. Vai trò `ACADEMIC_STAFF` trong seed có username là gì? Password?**

`backend/prisma/seed.ts` – user `giaovu01`, password `Staff@123`.  
Map tới role `ACADEMIC_STAFF` (alias `GIAOVU` trong `RolesGuard`).

---

**Q105. Tìm tất cả chỗ trong code throw `ForbiddenException` liên quan đến score module.**

Tìm bằng: `grep -r "ForbiddenException" backend/src/scores/ backend/src/score-change-requests/ backend/src/authorization/`
Các chỗ chính:
- `permission-scope.service.ts` – `canEditSubjectScore()`, `canSubmitScoreSheet()`, `canLockScoreSheet()`, `canApproveScoreChangeRequest()`.
- `score-change-requests.service.ts` – `create()` khi không phải TEACHER, `approve()` khi không phải ACADEMIC_STAFF.

---

## Phụ lục – Câu hỏi Scenario

**S1. Giáo viên gọi `GET /scores/sheets` nhưng không thấy bảng điểm nào. Debug thế nào?**

1. Kiểm tra `user.teacherId` trong JWT payload (gọi `GET /auth/me`).  
2. Kiểm tra DB: `TeacherAssignment` có bản ghi nào `teacherId = X` và `isActive = true` không.  
3. Kiểm tra `buildSheetWhere()` trong `backend/src/scores/scores.service.ts` – logic filter theo assignment.  
4. Thử với ADMIN account để confirm data tồn tại.

---

**S2. ACADEMIC_STAFF không lock được bảng điểm. Lỗi 403. Debug ở đâu?**

`backend/src/authorization/permission-scope.service.ts` – method `canLockScoreSheet(user)`:
```ts
return this.canManageAcademicWorkflow(user); // ADMIN hoặc ACADEMIC_STAFF
```
Kiểm tra `canManageAcademicWorkflow()`:
```ts
return ['ADMIN', 'ACADEMIC_STAFF'].includes(user.role);
```
Nếu role trong JWT là `'GIAOVU'` thay vì `'ACADEMIC_STAFF'`, sẽ fail.  
Kiểm tra normalize role trong `RolesGuard` vs logic trong `PermissionScopeService`.

---

**S3. Import Excel bị lỗi "Mã HS đã tồn tại" nhưng DB trống. Có thể do gì?**

`backend/src/import/import.service.ts` – `previewStudentImport()`:
```ts
const existingCodes = new Set(
  (await this.prisma.student.findMany({ select: { studentCode: true } })).map(s => s.studentCode)
);
```
Cần kiểm tra có duplicate `studentCode` trong **chính file Excel đang upload** không.  
Nếu trong file có 2 dòng `S001`, dòng thứ 2 sẽ bị lỗi vì `existingCodes` có thể bị cập nhật mid-loop (tùy implementation). Cũng cần verify DB connection đúng environment.

---

**S4. Muốn biết request nào đã assign học sinh S001 vào lớp 10A1, tìm ở đâu?**

Query bảng `AuditLog`:
```sql
SELECT * FROM "AuditLog" WHERE "entityType" = 'Enrollment' AND "entityId" = <enrollmentId>;
```
Hoặc dùng API `GET /api/v1/audit-logs?entityType=Enrollment&entityId=<id>`.  
Log được tạo trong `backend/src/enrollments/enrollments.service.ts` – method `assign()`.

---

**S5. Giáo viên submit bảng điểm nhưng status vẫn là DRAFT. Bug ở đâu?**

Kiểm tra `backend/src/scores/scores.service.ts` – method `submitSheet()`:
1. Permission check: `canSubmitScoreSheet(user, classId, subjectId, semesterId)`.  
2. Prisma update: `prisma.scoreSheet.update({ where: { id }, data: { status: 'SUBMITTED', submittedAt: new Date() } })`.  
3. Nếu không có lỗi nhưng status không thay đổi → kiểm tra transaction hoặc có `.update()` nào bị override sau.

---

## Nhóm 15 – Bugs phát hiện & đã sửa trong repo

**B1. Bug: mỗi học sinh xuất hiện 2 lần trong trang nhập điểm. Nguyên nhân ở đâu?**

`backend/src/classes/classes.service.ts` – method `getStudents()` (cũ):
```ts
where: { classId: id, status: 'ACTIVE' }  // thiếu semesterId
```
Mỗi học sinh có 2 `StudentClassEnrollment` ACTIVE (HK1 + HK2) → API trả về 2 row → frontend render 2 dòng.  
`ScoreEntryPage.tsx` dùng `key={student.id}` nhưng React vẫn render cả 2 khi array gốc có duplicate.

---

**B2. Fix bug duplicate row: sửa những file nào?**

3 file:
1. `backend/src/classes/classes.service.ts` – thêm param `semesterId?`, filter `...(semesterId ? { semesterId } : {})`.
2. `backend/src/classes/classes.controller.ts` – nhận `@Query('semesterId') semesterId: string | undefined`, pass xuống service.
3. `frontend/src/pages/scores/ScoreEntryPage.tsx` – truyền `sheetData.semesterId` khi gọi `getClassStudents()`.

---

**B3. Tại sao `ClassDetailPage` không cần fix tương tự?**

`frontend/src/pages/classes/ClassDetailPage.tsx` – dùng `key={row.enrollmentId}` và có cột "Học kỳ".  
Trang này intentionally hiển thị per-enrollment (một row mỗi kỳ học), không phải per-student.  
`ScoreEntryPage` cần per-student (một row mỗi học sinh) nên phải lọc theo `semesterId`.

---

**B4. Bug: import điểm báo "không có trong danh sách lớp" dù học sinh đang enrolled. Nguyên nhân?**

`backend/src/import/import.service.ts` – `previewScoreImport()` cũ:
```ts
const enrolledCodes = new Set(sheet.studentScores.map(ss => ss.student.studentCode));
```
`sheet.studentScores` = `StudentSubjectScore` đã có trong sheet → học sinh chưa từng được nhập điểm thủ công sẽ không có record → bị từ chối import dù đang enrolled.

---

**B5. Fix bug import: logic validate thay đổi thế nào?**

`backend/src/import/import.service.ts` – `previewScoreImport()` mới:
```ts
const enrollments = await this.prisma.studentClassEnrollment.findMany({
  where: { classId: sheet.classId, semesterId: sheet.semesterId, status: 'ACTIVE' },
});
const enrolledCodes = new Set(enrollments.map(e => e.student.studentCode));
```
Validate bằng `StudentClassEnrollment` thay vì `StudentSubjectScore` → đúng với thực tế ai đang học lớp đó.

---

**B6. `commitScoreImport()` cũ có thể bỏ sót học sinh nào?**

`backend/src/import/import.service.ts` – `commitScoreImport()` cũ:
```ts
const ss = sheet.studentScores.find(s => s.student.studentCode === row.studentCode);
if (!ss) continue;  // bỏ qua nếu chưa có StudentSubjectScore
```
Học sinh có trong file Excel nhưng chưa có `StudentSubjectScore` trong sheet → bị `continue` → điểm không được lưu dù preview đã pass.  
Fix: dùng `prisma.studentSubjectScore.upsert()` để tạo record mới nếu chưa có.

---

**B7. Sau khi `commitScoreImport()` lưu `ScoreDetail`, service có tính `averageScore` không?**

Có – đã được thêm vào fix:
```ts
const totalWeight = details.reduce((sum, d) => sum + d.weightSnapshot, 0);
const weightedSum = details.reduce((sum, d) => sum + d.score * d.weightSnapshot, 0);
const averageScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;
await this.prisma.studentSubjectScore.update({ where: { id: ss.id }, data: { averageScore, passStatus, calculatedAt } });
```
Version cũ không tính lại `averageScore` sau import → điểm trung bình bị `null` dù đã có đủ `ScoreDetail`.

---

**B8. Seed tạo HK2-MATH 10A1 chỉ có 10/20 học sinh – tại sao không phải bug seed?**

`backend/prisma/seed.ts` – dòng 474:
```ts
buildSheet('10A1','MATH', hk2.id, 0, in10A1.slice(0,10), ScoreSheetStatus.DRAFT)
```
Đây là **intentional demo state**: mô phỏng GVBM đang nhập điểm dở (10 học sinh đã nhập, 10 chưa).  
Sau khi fix import service, 10 học sinh còn lại có thể import bình thường vì `previewScoreImport` validate qua `StudentClassEnrollment`.

---

## Ghi chú – Sai lệch giữa docs/viva-prep.md và code thật

| # | Nội dung trong viva-prep.md | Thực tế trong code | File cần kiểm tra |
|---|---|---|---|
| 1 | Không đề cập `NEEDS_CORRECTION` status | Schema có `ScoreSheetStatus.NEEDS_CORRECTION` | `prisma/schema.prisma` |
| 2 | Nói notification "đã implement" như feature mới | `NotificationsModule` đã có trong `AppModule` từ đầu | `app.module.ts` |
| 3 | Scenario "Export report Excel" nói chưa làm | `ImportModule` có `scoreSheetTemplate` export Excel | `import.controller.ts` |
| 4 | Không đề cập two-step preview/commit pattern | Import dùng preview → commit rõ ràng | `import.controller.ts`, `import.service.ts` |
| 5 | Student transcript PDF nói chỉ ADMIN/STAFF xem | `@Roles` cho phép cả STUDENT và TEACHER | `reports.controller.ts` |
| 6 | Không đề cập `ipAddress` trong AuditLog | `AuditLogEntry` có `ipAddress?: string` | `audit-log.service.ts` |
| 7 | Không đề cập `ROLE_ALIASES` GIAOVU/BGH | `RolesGuard` có alias map | `roles.guard.ts` |
| 8 | Mô tả `canLockScoreSheet` cho cả TEACHER | Code chỉ cho ADMIN/ACADEMIC_STAFF | `permission-scope.service.ts` |

---

## Bugs đã sửa trong quá trình vấn đáp

| # | Bug | File gốc | Fix |
|---|---|---|---|
| 1 | `GET /classes/:id/students` không filter `semesterId` → học sinh hiện 2 lần trong ScoreEntryPage | `classes.service.ts`, `classes.controller.ts` | Thêm optional param `semesterId`, pass từ frontend |
| 2 | `previewScoreImport` validate bằng `StudentSubjectScore` → học sinh chưa có record bị từ chối | `import.service.ts` | Đổi sang query `StudentClassEnrollment` |
| 3 | `commitScoreImport` skip học sinh không có `StudentSubjectScore` | `import.service.ts` | Upsert `StudentSubjectScore` tự động trước khi lưu điểm |
| 4 | `commitScoreImport` không tính lại `averageScore` sau import | `import.service.ts` | Thêm recalculate `averageScore` + `passStatus` sau mỗi học sinh |
