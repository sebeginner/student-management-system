import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const seedAdminPassword     = process.env.SEED_ADMIN_PASSWORD    ?? 'Admin@123';
const seedStaffPassword     = process.env.SEED_STAFF_PASSWORD    ?? 'Staff@123';
const seedManagerPassword   = process.env.SEED_MANAGER_PASSWORD  ?? 'Manager@123';
const seedTeacherPassword   = process.env.SEED_TEACHER_PASSWORD  ?? 'Teacher@123';
const seedStudentPassword   = process.env.SEED_STUDENT_PASSWORD  ?? 'Student@123';
const saltRounds            = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

function toDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, saltRounds);
}

async function main() {
  console.log('Seeding demo data (idempotent)...');

  // ─────────────────────────────────────────
  // 0) Hash passwords
  // ─────────────────────────────────────────
  const [hashedAdmin, hashedStaff, hashedManager, hashedTeacher, hashedStudent] =
    await Promise.all([
      hashPassword(seedAdminPassword),
      hashPassword(seedStaffPassword),
      hashPassword(seedManagerPassword),
      hashPassword(seedTeacherPassword),
      hashPassword(seedStudentPassword),
    ]);

  // ─────────────────────────────────────────
  // 1) Roles — đủ 5 role theo AGENTS.md
  // ─────────────────────────────────────────
  const adminRole   = await prisma.role.upsert({ where: { name: 'ADMIN' },          update: {}, create: { name: 'ADMIN' } });
  const staffRole   = await prisma.role.upsert({ where: { name: 'ACADEMIC_STAFF' }, update: {}, create: { name: 'ACADEMIC_STAFF' } });
  const managerRole = await prisma.role.upsert({ where: { name: 'MANAGER' },        update: {}, create: { name: 'MANAGER' } });
  const teacherRole = await prisma.role.upsert({ where: { name: 'TEACHER' },        update: {}, create: { name: 'TEACHER' } });
  const studentRole = await prisma.role.upsert({ where: { name: 'STUDENT' },        update: {}, create: { name: 'STUDENT' } });

  // ─────────────────────────────────────────
  // 2) SchoolYear + SystemParameter + Semester
  // ─────────────────────────────────────────
  const schoolYearsData = [
    {
      name: '2025-2026',
      startYear: 2025,
      endYear: 2026,
      startDate: '2025-09-01',
      endDate: '2026-05-30',
      isActive: true,
      hk1Start: '2025-09-01',
      hk1End: '2026-01-15',
      hk2Start: '2026-01-16',
      hk2End: '2026-05-30',
    },
    {
      name: '2024-2025',
      startYear: 2024,
      endYear: 2025,
      startDate: '2024-09-01',
      endDate: '2025-05-30',
      isActive: false,
      hk1Start: '2024-09-01',
      hk1End: '2025-01-15',
      hk2Start: '2025-01-16',
      hk2End: '2025-05-30',
    },
  ];

  const schoolYears: Array<{ id: number; name: string; startDate: Date; endDate: Date; isActive: boolean }> = [];

  for (const sy of schoolYearsData) {
    const created = await prisma.schoolYear.upsert({
      where: { name: sy.name },
      update: {
        startYear: sy.startYear,
        endYear: sy.endYear,
        startDate: toDate(sy.startDate),
        endDate: toDate(sy.endDate),
        isActive: sy.isActive,
      },
      create: {
        name: sy.name,
        startYear: sy.startYear,
        endYear: sy.endYear,
        startDate: toDate(sy.startDate),
        endDate: toDate(sy.endDate),
        isActive: sy.isActive,
      },
    });
    schoolYears.push(created);
  }

  // SystemParameter — không có unique constraint, dùng findFirst + update/create
  for (const sy of schoolYears) {
    const existing = await prisma.systemParameter.findFirst({
      where: { schoolYearId: sy.id },
      orderBy: { effectiveFrom: 'desc' },
    });
    const data = {
      schoolYearId: sy.id,
      minAge: 15,
      maxAge: 20,
      maxClassSize: 40,
      minScore: 0,
      maxScore: 10,
      subjectPassScore: 5,
      semesterPassScore: 5,
      effectiveFrom: sy.startDate,
      effectiveTo: null,
    };
    if (existing) {
      await prisma.systemParameter.update({ where: { id: existing.id }, data });
    } else {
      await prisma.systemParameter.create({ data });
    }
  }

  // Semesters
  const semestersByYear = new Map<number, { hk1: any; hk2: any }>();

  for (let i = 0; i < schoolYears.length; i++) {
    const sy  = schoolYears[i];
    const raw = schoolYearsData[i];

    const hk1 = await prisma.semester.upsert({
      where: { schoolYearId_name: { schoolYearId: sy.id, name: 'HK1' } },
      update: { startDate: toDate(raw.hk1Start), endDate: toDate(raw.hk1End), isActive: sy.isActive },
      create: { schoolYearId: sy.id, name: 'HK1', startDate: toDate(raw.hk1Start), endDate: toDate(raw.hk1End), isActive: sy.isActive },
    });

    const hk2 = await prisma.semester.upsert({
      where: { schoolYearId_name: { schoolYearId: sy.id, name: 'HK2' } },
      update: { startDate: toDate(raw.hk2Start), endDate: toDate(raw.hk2End), isActive: false },
      create: { schoolYearId: sy.id, name: 'HK2', startDate: toDate(raw.hk2Start), endDate: toDate(raw.hk2End), isActive: false },
    });

    semestersByYear.set(sy.id, { hk1, hk2 });
  }

  // ─────────────────────────────────────────
  // 3) Grade Levels
  // ─────────────────────────────────────────
  const grade10 = await prisma.gradeLevel.upsert({ where: { name: '10' }, update: { level: 10, isActive: true }, create: { name: '10', level: 10, isActive: true } });
  const grade11 = await prisma.gradeLevel.upsert({ where: { name: '11' }, update: { level: 11, isActive: true }, create: { name: '11', level: 11, isActive: true } });
  const grade12 = await prisma.gradeLevel.upsert({ where: { name: '12' }, update: { level: 12, isActive: true }, create: { name: '12', level: 12, isActive: true } });

  // ─────────────────────────────────────────
  // 4) Subjects
  // ─────────────────────────────────────────
  const subjectsData = [
    { code: 'MATH', name: 'Toán',  coefficient: 1 },
    { code: 'LIT',  name: 'Văn',   coefficient: 1 },
    { code: 'ENG',  name: 'Anh',   coefficient: 1 },
    { code: 'PHYS', name: 'Lý',    coefficient: 1 },
    { code: 'CHEM', name: 'Hóa',   coefficient: 1 },
    { code: 'BIO',  name: 'Sinh',  coefficient: 1 },
    { code: 'HIST', name: 'Sử',    coefficient: 1 },
    { code: 'GEO',  name: 'Địa',   coefficient: 1 },
    { code: 'IT',   name: 'Tin',   coefficient: 1 },
    { code: 'CIVIC',name: 'GDCD',  coefficient: 1 },
    { code: 'PE',   name: 'Thể dục', coefficient: 1 },
  ];

  const subjectMap = new Map<string, any>();
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { subjectCode: s.code },
      update: { name: s.name, coefficient: s.coefficient, isActive: true },
      create: { subjectCode: s.code, name: s.name, coefficient: s.coefficient, isActive: true },
    });
    subjectMap.set(s.code, sub);
  }

  const math = subjectMap.get('MATH')!;
  const lit  = subjectMap.get('LIT')!;

  // ─────────────────────────────────────────
  // 5) Teachers
  // ─────────────────────────────────────────
  const teacher1 = await prisma.teacher.upsert({
    where: { teacherCode: 'T001' },
    update: { fullName: 'Nguyễn Văn An', email: 'teacher01@school.edu.vn', phone: '0900000001', subjectId: math.id, status: 'ACTIVE' },
    create: { teacherCode: 'T001', fullName: 'Nguyễn Văn An', email: 'teacher01@school.edu.vn', phone: '0900000001', subjectId: math.id, status: 'ACTIVE' },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { teacherCode: 'T002' },
    update: { fullName: 'Trần Thị Bình', email: 'teacher02@school.edu.vn', phone: '0900000002', subjectId: lit.id, status: 'ACTIVE' },
    create: { teacherCode: 'T002', fullName: 'Trần Thị Bình', email: 'teacher02@school.edu.vn', phone: '0900000002', subjectId: lit.id, status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────
  // 6) Students — 5 học sinh mẫu cho demo
  // ─────────────────────────────────────────
  const studentsData = [
    { code: 'S001', name: 'Lê Minh Châu',    dob: '2008-02-01', gender: 'MALE',   email: 'student01@school.edu.vn' },
    { code: 'S002', name: 'Phạm Thị Dung',   dob: '2008-05-12', gender: 'FEMALE', email: 'student02@school.edu.vn' },
    { code: 'S003', name: 'Hoàng Văn Em',    dob: '2008-07-20', gender: 'MALE',   email: 'student03@school.edu.vn' },
    { code: 'S004', name: 'Ngô Thị Phương',  dob: '2008-11-03', gender: 'FEMALE', email: 'student04@school.edu.vn' },
    { code: 'S005', name: 'Đặng Quốc Toàn',  dob: '2008-03-15', gender: 'MALE',   email: 'student05@school.edu.vn' },
  ];

  const studentMap = new Map<string, any>();
  for (const s of studentsData) {
    const st = await prisma.student.upsert({
      where: { studentCode: s.code },
      update: { fullName: s.name, gender: s.gender, dateOfBirth: toDate(s.dob), admissionDate: toDate('2025-09-01'), email: s.email, status: 'ACTIVE' },
      create: { studentCode: s.code, fullName: s.name, gender: s.gender, dateOfBirth: toDate(s.dob), admissionDate: toDate('2025-09-01'), address: 'TP.HCM', email: s.email, status: 'ACTIVE' },
    });
    studentMap.set(s.code, st);
  }

  const student1 = studentMap.get('S001')!;

  // ─────────────────────────────────────────
  // 7) Users
  // ─────────────────────────────────────────

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { email: 'admin@school.edu.vn', passwordHash: hashedAdmin, fullName: 'Quản trị viên', roleId: adminRole.id, status: 'ACTIVE', studentId: null, teacherId: null },
    create: { username: 'admin', email: 'admin@school.edu.vn', passwordHash: hashedAdmin, fullName: 'Quản trị viên', roleId: adminRole.id, status: 'ACTIVE' },
  });

  // Giáo vụ
  await prisma.user.upsert({
    where: { username: 'giaovu01' },
    update: { email: 'giaovu01@school.edu.vn', passwordHash: hashedStaff, fullName: 'Giáo vụ 01', roleId: staffRole.id, status: 'ACTIVE', studentId: null, teacherId: null },
    create: { username: 'giaovu01', email: 'giaovu01@school.edu.vn', passwordHash: hashedStaff, fullName: 'Giáo vụ 01', roleId: staffRole.id, status: 'ACTIVE' },
  });

  // Ban giám hiệu
  await prisma.user.upsert({
    where: { username: 'manager01' },
    update: { email: 'manager01@school.edu.vn', passwordHash: hashedManager, fullName: 'Hiệu trưởng', roleId: managerRole.id, status: 'ACTIVE', studentId: null, teacherId: null },
    create: { username: 'manager01', email: 'manager01@school.edu.vn', passwordHash: hashedManager, fullName: 'Hiệu trưởng', roleId: managerRole.id, status: 'ACTIVE' },
  });

  // Teacher 01 — GVCN + GVBM Toán
  await prisma.user.upsert({
    where: { username: 'teacher01' },
    update: { email: 'teacher01@school.edu.vn', passwordHash: hashedTeacher, fullName: 'Nguyễn Văn An', roleId: teacherRole.id, teacherId: teacher1.id, status: 'ACTIVE', studentId: null },
    create: { username: 'teacher01', email: 'teacher01@school.edu.vn', passwordHash: hashedTeacher, fullName: 'Nguyễn Văn An', roleId: teacherRole.id, teacherId: teacher1.id, status: 'ACTIVE' },
  });

  // Teacher 02 — GVBM Văn
  await prisma.user.upsert({
    where: { username: 'teacher02' },
    update: { email: 'teacher02@school.edu.vn', passwordHash: hashedTeacher, fullName: 'Trần Thị Bình', roleId: teacherRole.id, teacherId: teacher2.id, status: 'ACTIVE', studentId: null },
    create: { username: 'teacher02', email: 'teacher02@school.edu.vn', passwordHash: hashedTeacher, fullName: 'Trần Thị Bình', roleId: teacherRole.id, teacherId: teacher2.id, status: 'ACTIVE' },
  });

  // Student 01 — có tài khoản đăng nhập
  await prisma.user.upsert({
    where: { username: 'student01' },
    update: { email: 'student01@school.edu.vn', passwordHash: hashedStudent, fullName: 'Lê Minh Châu', roleId: studentRole.id, studentId: student1.id, status: 'ACTIVE', teacherId: null },
    create: { username: 'student01', email: 'student01@school.edu.vn', passwordHash: hashedStudent, fullName: 'Lê Minh Châu', roleId: studentRole.id, studentId: student1.id, status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────
  // 8) Classes
  // ─────────────────────────────────────────
  const activeSY  = schoolYears.find((y) => y.isActive)!;
  const semesters = semestersByYear.get(activeSY.id)!;
  const hk1       = semesters.hk1;

  const classesData = [
    { code: '10A1', name: '10A1', gradeLevelId: grade10.id, homeroomTeacherId: teacher1.id },
    { code: '10A2', name: '10A2', gradeLevelId: grade10.id, homeroomTeacherId: teacher2.id },
    { code: '11A1', name: '11A1', gradeLevelId: grade11.id, homeroomTeacherId: null },
    { code: '12A1', name: '12A1', gradeLevelId: grade12.id, homeroomTeacherId: null },
  ];

  const classMap = new Map<string, any>();
  for (const c of classesData) {
    const cls = await prisma.class.upsert({
      where: { classCode: c.code },
      update: { name: c.name, maxSize: 40, status: 'ACTIVE', gradeLevelId: c.gradeLevelId, schoolYearId: activeSY.id, homeroomTeacherId: c.homeroomTeacherId },
      create: { classCode: c.code, name: c.name, maxSize: 40, currentSize: 0, status: 'ACTIVE', gradeLevelId: c.gradeLevelId, schoolYearId: activeSY.id, homeroomTeacherId: c.homeroomTeacherId },
    });
    classMap.set(c.code, cls);
  }

  const class10A1 = classMap.get('10A1')!;

  // ─────────────────────────────────────────
  // 9) Enrollments — tất cả 5 học sinh vào 10A1 HK1
  // ─────────────────────────────────────────
  for (const [, student] of studentMap) {
    await prisma.studentClassEnrollment.upsert({
      where: { studentId_semesterId: { studentId: student.id, semesterId: hk1.id } },
      update: { classId: class10A1.id, status: 'ACTIVE' },
      create: { studentId: student.id, classId: class10A1.id, semesterId: hk1.id, status: 'ACTIVE' },
    });
  }

  // Cập nhật currentSize
  const enrolledCount = await prisma.studentClassEnrollment.count({
    where: { classId: class10A1.id, status: 'ACTIVE' },
  });
  await prisma.class.update({
    where: { id: class10A1.id },
    data: { currentSize: enrolledCount },
  });

  // ─────────────────────────────────────────
  // 10) TestTypes + ScoreWeights
  // ─────────────────────────────────────────
  const testTypesData = [
    { code: 'ORAL_15M',   name: 'Miệng/15 phút', defaultWeight: 1, isMultiple: true },
    { code: 'ONE_PERIOD', name: '1 tiết',         defaultWeight: 2, isMultiple: true },
    { code: 'MIDTERM',    name: 'Giữa kỳ',        defaultWeight: 3, isMultiple: false },
    { code: 'FINAL',      name: 'Cuối kỳ',        defaultWeight: 3, isMultiple: false },
  ];

  const testTypes: any[] = [];
  for (const tt of testTypesData) {
    const created = await prisma.testType.upsert({
      where: { code: tt.code },
      update: { name: tt.name, defaultWeight: tt.defaultWeight, isMultiple: tt.isMultiple },
      create: { code: tt.code, name: tt.name, defaultWeight: tt.defaultWeight, isMultiple: tt.isMultiple },
    });
    testTypes.push(created);
  }

  // ScoreWeight — không có unique constraint, dùng findFirst
  for (const tt of testTypes) {
    const existing = await prisma.scoreWeight.findFirst({
      where: { schoolYearId: activeSY.id, testTypeId: tt.id },
      orderBy: { effectiveFrom: 'desc' },
    });
    const data = {
      schoolYearId: activeSY.id,
      testTypeId: tt.id,
      weight: tt.defaultWeight,
      effectiveFrom: activeSY.startDate,
      effectiveTo: null,
    };
    if (existing) {
      await prisma.scoreWeight.update({ where: { id: existing.id }, data });
    } else {
      await prisma.scoreWeight.create({ data });
    }
  }

  // ─────────────────────────────────────────
  // 11) TeacherAssignments
  //     HOMEROOM: teacher1 → 10A1 (cả năm, không cần semesterId)
  //     SUBJECT:  teacher1 → Toán / 10A1 / HK1
  //     SUBJECT:  teacher2 → Văn  / 10A1 / HK1
  // ─────────────────────────────────────────

  // HOMEROOM — semesterId không bắt buộc theo AGENTS.md nên dùng HK1 làm đại diện
  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_semesterId: {
        teacherId: teacher1.id,
        classId: class10A1.id,
        subjectId: math.id,   // placeholder cho HOMEROOM vì schema yêu cầu subjectId
        semesterId: hk1.id,
      },
    },
    update: { assignmentType: 'HOMEROOM' },
    create: {
      teacherId: teacher1.id,
      classId: class10A1.id,
      subjectId: math.id,
      semesterId: hk1.id,
      assignmentType: 'HOMEROOM',
    },
  });

  // SUBJECT: teacher1 dạy Toán 10A1 HK1
  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_semesterId: {
        teacherId: teacher1.id,
        classId: class10A1.id,
        subjectId: math.id,
        semesterId: hk1.id,
      },
    },
    update: { assignmentType: 'SUBJECT' },
    create: {
      teacherId: teacher1.id,
      classId: class10A1.id,
      subjectId: math.id,
      semesterId: hk1.id,
      assignmentType: 'SUBJECT',
    },
  });

  // SUBJECT: teacher2 dạy Văn 10A1 HK1
  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_semesterId: {
        teacherId: teacher2.id,
        classId: class10A1.id,
        subjectId: lit.id,
        semesterId: hk1.id,
      },
    },
    update: { assignmentType: 'SUBJECT' },
    create: {
      teacherId: teacher2.id,
      classId: class10A1.id,
      subjectId: lit.id,
      semesterId: hk1.id,
      assignmentType: 'SUBJECT',
    },
  });

  // ─────────────────────────────────────────
  // 12) ScoreSheet môn Toán 10A1 HK1 + điểm mẫu cho tất cả học sinh
  // ─────────────────────────────────────────
  const scoreSheet = await prisma.scoreSheet.upsert({
    where: { classId_subjectId_semesterId: { classId: class10A1.id, subjectId: math.id, semesterId: hk1.id } },
    update: { status: 'DRAFT' },
    create: { classId: class10A1.id, subjectId: math.id, semesterId: hk1.id, status: 'DRAFT' },
  });

  // Điểm mẫu khác nhau cho mỗi học sinh để demo trông thật
  const sampleScores: Record<string, { ORAL_15M: number; ONE_PERIOD: number; MIDTERM: number; FINAL: number }> = {
    S001: { ORAL_15M: 8.0, ONE_PERIOD: 7.5, MIDTERM: 8.0, FINAL: 9.0 },
    S002: { ORAL_15M: 6.5, ONE_PERIOD: 7.0, MIDTERM: 6.0, FINAL: 7.5 },
    S003: { ORAL_15M: 9.0, ONE_PERIOD: 8.5, MIDTERM: 9.0, FINAL: 9.5 },
    S004: { ORAL_15M: 5.0, ONE_PERIOD: 5.5, MIDTERM: 5.0, FINAL: 6.0 },
    S005: { ORAL_15M: 7.0, ONE_PERIOD: 8.0, MIDTERM: 7.5, FINAL: 8.0 },
  };

  for (const [code, student] of studentMap) {
    const scores = sampleScores[code];
    if (!scores) continue;

    const sss = await prisma.studentSubjectScore.upsert({
      where: { scoreSheetId_studentId: { scoreSheetId: scoreSheet.id, studentId: student.id } },
      update: { averageScore: null, passStatus: null },
      create: { scoreSheetId: scoreSheet.id, studentId: student.id, averageScore: null, passStatus: null },
    });

    for (const tt of testTypes) {
      const score = scores[tt.code as keyof typeof scores];
      if (score === undefined) continue;

      const sw = await prisma.scoreWeight.findFirst({
        where: { schoolYearId: activeSY.id, testTypeId: tt.id },
        orderBy: { effectiveFrom: 'desc' },
      });

      await prisma.scoreDetail.upsert({
        where: { studentSubjectScoreId_testTypeId_attemptNo: { studentSubjectScoreId: sss.id, testTypeId: tt.id, attemptNo: 1 } },
        update: { score, weightSnapshot: sw?.weight ?? tt.defaultWeight },
        create: { studentSubjectScoreId: sss.id, testTypeId: tt.id, attemptNo: 1, score, weightSnapshot: sw?.weight ?? tt.defaultWeight },
      });
    }

    // Tính averageScore theo công thức: (oral*1 + onePeriod*2 + midterm*3 + final*3) / 9
    const avg = (scores.ORAL_15M * 1 + scores.ONE_PERIOD * 2 + scores.MIDTERM * 3 + scores.FINAL * 3) / 9;
    const avgRounded = Math.round(avg * 100) / 100;

    await prisma.studentSubjectScore.update({
      where: { id: sss.id },
      data: { averageScore: avgRounded, passStatus: avgRounded >= 5, calculatedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────
  // Done
  // ─────────────────────────────────────────
  console.log('\n✅ Seed completed successfully.\n');
  console.log('Tài khoản demo:');
  console.log(`  Admin:    admin      / ${seedAdminPassword}`);
  console.log(`  Giáo vụ: giaovu01   / ${seedStaffPassword}`);
  console.log(`  BGH:     manager01  / ${seedManagerPassword}`);
  console.log(`  GV 01:   teacher01  / ${seedTeacherPassword}  (GVCN + GVBM Toán 10A1 HK1)`);
  console.log(`  GV 02:   teacher02  / ${seedTeacherPassword}  (GVBM Văn 10A1 HK1)`);
  console.log(`  HS 01:   student01  / ${seedStudentPassword}`);
  console.log('\nDữ liệu:');
  console.log('  Năm học: 2025-2026 (active), 2024-2025');
  console.log('  Học kỳ: HK1, HK2');
  console.log('  Lớp: 10A1 (5 học sinh), 10A2, 11A1, 12A1');
  console.log('  Môn: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin, GDCD, Thể dục');
  console.log('  Bảng điểm: Toán 10A1 HK1 (DRAFT, có điểm mẫu)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });