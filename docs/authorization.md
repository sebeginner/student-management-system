# Authorization and permission scope

Backend dung `PermissionScopeService` tai `backend/src/authorization/permission-scope.service.ts` de gom logic phan quyen theo scope du lieu.

## Nguyen tac role

- `ADMIN`: duoc bypass trong dev/demo, nhung khong phai actor nghiep vu hoc vu chinh.
- `ACADEMIC_STAFF`: xem va thao tac hoc vu toan truong, duoc khoa bang diem va duyet yeu cau sua diem.
- `MANAGER`: xem du lieu/bao cao toan truong, khong nhap/sua diem.
- `TEACHER`: quyen phu thuoc `TeacherAssignment`.
- `STUDENT`: chi xem du lieu cua chinh minh.

## Ma tran quyen demo P0

### Admin

- Quan tri ky thuat, tai khoan, role va cau hinh he thong.
- Duoc bypass trong moi truong dev/demo neu can go loi.
- Khong duoc xem la actor chinh cho nghiep vu hoc vu hang ngay.

### Giao vu (`ACADEMIC_STAFF`)

- Quan ly hoc sinh, lop, nam hoc, hoc ky, khoi, mon hoc va giao vien.
- Phan lop, chuyen lop va phan cong GVCN/GVBM.
- Xem toan truong, tao/sua du lieu hoc vu, khoa bang diem.
- Duyet hoac tu choi yeu cau sua diem sau khi bang diem da khoa.

### BGH/Manager (`MANAGER`)

- Xem du lieu va bao cao toan truong.
- Giam sat dashboard, tong ket lop, tong ket mon va tong ket hoc sinh.
- Khong nhap diem, khong sua diem, khong phan lop/chuyen lop.

### GVCN

- La `TEACHER` co `TeacherAssignment` loai `HOMEROOM`.
- Xem danh sach hoc sinh, ho so, diem va bao cao cua lop chu nhiem.
- Khong nhap/sua diem neu khong dong thoi co assignment `SUBJECT` dung lop/mon/hoc ky.

### GVBM

- La `TEACHER` co `TeacherAssignment` loai `SUBJECT`.
- Xem danh sach hoc sinh cua lop minh day.
- Nhap/sua diem dung lop/mon/hoc ky khi bang diem chua `LOCKED`.
- Submit bang diem va gui yeu cau sua diem khi bang diem da `LOCKED`.
- Khong khoa bang diem va khong duyet yeu cau sua diem.

### Hoc sinh (`STUDENT`)

- Chi xem ho so, diem va bao cao hoc ky cua chinh minh.
- Khong xem diem/hoc sinh/lop cua nguoi khac.

## GVCN/GVBM

`TEACHER` la role tai khoan chung. GVCN va GVBM khong phai role dang nhap rieng.

- GVCN: `TeacherAssignment.assignmentType = HOMEROOM`.
- GVBM: `TeacherAssignment.assignmentType = SUBJECT`.
- Mot giao vien co the vua la GVCN vua la GVBM.

## PermissionScopeService

Service hien co cac ham:

```ts
canViewClassStudents(user, classId)
canViewStudentProfile(user, studentId)
canViewStudentScores(user, studentId)
canViewClassScores(user, classId)
canEditSubjectScore(user, classId, subjectId, semesterId, scoreSheetStatus)
canSubmitScoreSheet(user, classId, subjectId, semesterId)
canLockScoreSheet(user)
canApproveScoreChangeRequest(user)
canViewScoreChangeRequest(user, requestId)

isHomeroomTeacherOfClass(teacherId, classId, schoolYearId)
isSubjectTeacherOfClass(teacherId, classId, subjectId, semesterId)
getTeacherByUserId(userId)
```

Ngoai ra co helper query scope:

```ts
classScopeWhereForUser(user)
studentScopeWhereForUser(user, requestedClassId?)
```

`StudentsService` va `ClassesService` da dung cac helper nay de tranh lap logic check assignment.

## Loi phan quyen

Cac ham `can...` tra `true` neu duoc phep, neu khong se nem `ForbiddenException` voi `errorKey`:

- `FORBIDDEN`
- `NOT_HOMEROOM_TEACHER`
- `NOT_SUBJECT_TEACHER`
- `NOT_STUDENT_OWNER`
- `SCORE_SHEET_LOCKED`

## Bang diem

- GVBM chi duoc nhap/sua diem dung lop/mon/hoc ky duoc phan cong.
- Neu bang diem `LOCKED`, GVBM khong duoc sua truc tiep.
- `ACADEMIC_STAFF` khong nen sua diem truc tiep khi bang diem da khoa; uu tien quy trinh score change request.
- Khoa bang diem va duyet yeu cau sua diem chi danh cho `ACADEMIC_STAFF` trong demo, `ADMIN` co bypass dev.
