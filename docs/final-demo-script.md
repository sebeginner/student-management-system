# Final Demo Script

Tai lieu nay dung de nhom thuyet trinh demo Student Management System theo luong P0.

## 1. Chuan bi truoc demo

Mo 2 terminal:

```bash
cd backend
npm run start:dev
```

```bash
cd frontend
npm run dev
```

Neu can reset du lieu demo:

```bash
cd backend
npx prisma migrate reset --force
npm run prisma:seed
```

Kiem tra nhanh:

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## 2. Tai khoan demo

| Vai tro | Username | Password | Muc dich demo |
|---|---|---|---|
| Admin | `admin` | `Admin@123` | Dang nhap va xem menu quan tri |
| Giao vu | `giaovu01` | `Staff@123` | Quan ly hoc sinh, lop, phan cong, khoa diem, duyet sua diem |
| Manager/BGH | `manager01` | `Manager@123` | Xem dashboard va bao cao |
| GVCN + GVBM Toan | `teacher01` | `Teacher@123` | Nhap diem Toan 10A1, submit, gui yeu cau sua diem |
| GVBM Van | `teacher02` | `Teacher@123` | Chung minh phan quyen khong duoc sua Toan |
| Hoc sinh | `student01` | `Student@123` | Xem diem ca nhan |

## 3. Luong demo chinh

### Buoc 1: Giao vu xem du lieu hoc vu

1. Dang nhap `giaovu01 / Staff@123`.
2. Vao `Students`.
3. Xac nhan co `student01..student05`.
4. Vao `Classes`.
5. Mo lop `10A1`.
6. Xac nhan hoc sinh da thuoc lop `10A1`.

Noi khi thuyet trinh: giao vu la actor trung tam quan ly hoc sinh, lop, phan lop va chuyen lop.

### Buoc 2: Giao vu xem phan cong giao vien

1. Vao `Teacher Assignments`.
2. Xac nhan:
   - `teacher01` la GVCN lop `10A1`.
   - `teacher01` la GVBM mon `Toan` lop `10A1` hoc ky `HK1`.
   - `teacher02` la GVBM mon `Van` lop `10A1` hoc ky `HK1`.

Noi khi thuyet trinh: GVCN/GVBM khong phai role dang nhap rieng, ma la assignment cua user role `TEACHER`.

### Buoc 3: Teacher01 nhap va submit diem Toan

1. Dang xuat, dang nhap `teacher01 / Teacher@123`.
2. Vao `Score Entry`.
3. Chon bang diem `Toan - 10A1 - HK1`.
4. Nhap hoac cap nhat diem thanh phan cho hoc sinh.
5. Bam `Save` tren tung dong can luu.
6. Bam `Submit` khi bang diem con trang thai `DRAFT`.

Ket qua mong doi:

- Toast bao luu diem thanh cong.
- Sau submit, bang diem chuyen sang `SUBMITTED`.

### Buoc 4: Giao vu khoa bang diem

1. Dang nhap lai `giaovu01`.
2. Vao `Score Entry` hoac danh sach `Scores`.
3. Mo bang diem `Toan - 10A1 - HK1`.
4. Bam `Lock` khi status la `SUBMITTED`.

Ket qua mong doi:

- Bang diem chuyen sang `LOCKED`.
- Teacher khong con sua diem truc tiep.

### Buoc 5: Teacher01 gui yeu cau sua diem sau khoa

1. Dang nhap `teacher01`.
2. Mo bang diem `Toan - 10A1 - HK1` da `LOCKED`.
3. Bam `Yeu cau sua diem`.
4. Chon hoc sinh, loai diem, nhap diem moi va ly do.
5. Submit yeu cau.

Ket qua mong doi:

- Tao score change request trang thai `PENDING`.
- Neu tao trung diem dang cho duyet, he thong hien loi `SCORE_CHANGE_REQUEST_DUPLICATED`.

### Buoc 6: Giao vu duyet yeu cau sua diem

1. Dang nhap `giaovu01`.
2. Vao `Score Change Requests`.
3. Mo request dang `PENDING`.
4. Bam `Approve`.
5. Quay lai bang diem Toan de xem diem da cap nhat.

Ket qua mong doi:

- Request chuyen sang `APPROVED`.
- Diem cua hoc sinh duoc cap nhat va diem trung binh tinh lai.

### Buoc 7: Hoc sinh xem diem ca nhan

1. Dang nhap `student01 / Student@123`.
2. Vao `My Scores`.
3. Xem diem cac mon/hoc ky cua chinh `student01`.

Noi khi thuyet trinh: frontend khong truyen `studentId`; backend lay user hien tai tu JWT qua `/scores/my-scores`.

### Buoc 8: Manager xem bao cao

1. Dang nhap `manager01 / Manager@123`.
2. Vao `Reports`.
3. Xem dashboard summary.
4. Loc lop/mon/hoc ky de xem:
   - so hoc sinh
   - diem trung binh
   - so dat
   - ty le dat

## 4. Luong phan quyen nen demo nhanh

### Student khong xem diem hoc sinh khac

- Dang nhap `student01`.
- Chi thay menu va trang diem ca nhan.
- API bao ve scope, khong co luong truyen `studentId` tuy y tu frontend.

### Teacher02 khong sua diem Toan

1. Dang nhap `teacher02`.
2. Vao danh sach bang diem.
3. `teacher02` chi lam GVBM `Van 10A1`.
4. Khi truy cap/sua diem Toan 10A1, backend tra `403 NOT_SUBJECT_TEACHER`.

### GVCN khong sua diem mon khong phu trach

- `teacher01` la GVCN `10A1`, nhung khong phai GVBM mon `Van`.
- `teacher01` co the xem bao cao lop chu nhiem, nhung khong duoc sua diem Van.

### GVBM khong xem/sua mon ngoai phan cong

- GVBM chi co scope theo `classId + subjectId + semesterId`.
- Neu khac mon/lop/hoc ky duoc phan cong, backend tra forbidden.

## 5. API da dung trong demo

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/students`
- `GET /api/v1/classes`
- `GET /api/v1/classes/:id/students`
- `GET /api/v1/teacher-assignments`
- `GET /api/v1/me/teacher-assignments`
- `GET /api/v1/scores/sheets`
- `GET /api/v1/scores/sheets/:id`
- `PUT /api/v1/scores/sheets/:id/students/:studentId`
- `POST /api/v1/scores/sheets/:id/submit`
- `POST /api/v1/scores/sheets/:id/lock`
- `GET /api/v1/score-change-requests`
- `POST /api/v1/score-change-requests`
- `POST /api/v1/score-change-requests/:id/approve`
- `GET /api/v1/scores/my-scores`
- `GET /api/v1/reports/dashboard-summary`
- `GET /api/v1/reports/class-semester`
- `GET /api/v1/reports/subject-summary`

## 6. Loi co chu dich de giai thich

- `CLASS_FULL`: lop da du si so.
- `STUDENT_ALREADY_ENROLLED`: hoc sinh da co lop active.
- `INVALID_TRANSFER_DIFFERENT_GRADE`: chuyen lop khac khoi khong hop le.
- `NOT_SUBJECT_TEACHER`: giao vien khong phu trach mon/lop/hoc ky nay.
- `SCORE_SHEET_LOCKED`: bang diem da khoa, khong sua truc tiep.
- `SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES`: thieu diem bat buoc khi submit.
- `SCORE_CHANGE_REQUEST_DUPLICATED`: da co yeu cau sua diem dang cho xu ly.
- `FORBIDDEN_REPORT_SCOPE`: xem bao cao ngoai pham vi duoc phan cong.
