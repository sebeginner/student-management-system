import 'dotenv/config';
import {
  PrismaClient,
  ScoreSheetStatus,
  TeacherAssignmentType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

<<<<<<< HEAD
const seedAdminPassword     = process.env.SEED_ADMIN_PASSWORD    ?? 'Admin@123';
const seedStaffPassword     = process.env.SEED_STAFF_PASSWORD    ?? 'Staff@123';
const seedManagerPassword   = process.env.SEED_MANAGER_PASSWORD  ?? 'Manager@123';
const seedTeacherPassword   = process.env.SEED_TEACHER_PASSWORD  ?? 'Teacher@123';
const seedStudentPassword   = process.env.SEED_STUDENT_PASSWORD  ?? 'Student@123';
const saltRounds            = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
=======
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
const seedAcademicStaffPassword = process.env.SEED_ACADEMIC_STAFF_PASSWORD ?? 'Staff@123';
const seedManagerPassword = process.env.SEED_MANAGER_PASSWORD ?? 'Manager@123';
const seedTeacherPassword = process.env.SEED_TEACHER_PASSWORD ?? 'Teacher@123';
const seedStudentPassword = process.env.SEED_STUDENT_PASSWORD ?? 'Student@123';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583

const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

<<<<<<< HEAD
function toDate(date: string): Date {
=======
type SeedStudent = {
  code: string;
  username: string;
  email: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
};

type ScoreInput = {
  studentCode: string;
  details: Array<{ code: string; score: number; attemptNo?: number }>;
};

function toDate(date: string) {
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
  return new Date(`${date}T00:00:00.000Z`);
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, saltRounds);
}

function calculateAverage(details: Array<{ code: string; score: number }>) {
  const byType = new Map<string, number[]>();
  for (const detail of details) {
    byType.set(detail.code, [...(byType.get(detail.code) ?? []), detail.score]);
  }

  const avg = (code: string) => {
    const values = byType.get(code) ?? [];
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const value =
    (avg('ORAL_15M') * 1 + avg('ONE_PERIOD') * 2 + avg('MIDTERM') * 3 + avg('FINAL') * 3) / 9;

  return Math.round(value * 100) / 100;
}

async function main() {
  console.log('Seeding demo data (idempotent)...');

<<<<<<< HEAD
  // ─────────────────────────────────────────
  // 0) Hash passwords
  // ─────────────────────────────────────────
  const [hashedAdmin, hashedStaff, hashedManager, hashedTeacher, hashedStudent] =
    await Promise.all([
      hashPassword(seedAdminPassword),
      hashPassword(seedStaffPassword),
=======
  const [hashedAdmin, hashedAcademicStaff, hashedManager, hashedTeacher, hashedStudent] =
    await Promise.all([
      hashPassword(seedAdminPassword),
      hashPassword(seedAcademicStaffPassword),
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
      hashPassword(seedManagerPassword),
      hashPassword(seedTeacherPassword),
      hashPassword(seedStudentPassword),
    ]);

<<<<<<< HEAD
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
=======
  const roles = await Promise.all(
    ['ADMIN', 'ACADEMIC_STAFF', 'MANAGER', 'TEACHER', 'STUDENT'].map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  const roleByName = new Map(roles.map((role) => [role.name, role]));

  const schoolYear = await prisma.schoolYear.upsert({
    where: { name: '2025-2026' },
    update: {
      startYear: 2025,
      endYear: 2026,
      startDate: toDate('2025-09-01'),
      endDate: toDate('2026-05-30'),
      isActive: true,
    },
    create: {
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
      name: '2025-2026',
      startYear: 2025,
      endYear: 2026,
      startDate: toDate('2025-09-01'),
      endDate: toDate('2026-05-30'),
      isActive: true,
      hk1Start: '2025-09-01',
      hk1End: '2026-01-15',
      hk2Start: '2026-01-16',
      hk2End: '2026-05-30',
    },
<<<<<<< HEAD
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
=======
  });

  await prisma.systemParameter.upsert({
    where: { schoolYearId: schoolYear.id },
    update: {
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
      minAge: 15,
      maxAge: 20,
      maxClassSize: 40,
      minScore: 0,
      maxScore: 10,
      subjectPassScore: 5,
      semesterPassScore: 5,
      effectiveFrom: schoolYear.startDate,
      effectiveTo: null,
<<<<<<< HEAD
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
=======
    },
    create: {
      schoolYearId: schoolYear.id,
      minAge: 15,
      maxAge: 20,
      maxClassSize: 40,
      minScore: 0,
      maxScore: 10,
      subjectPassScore: 5,
      semesterPassScore: 5,
      effectiveFrom: schoolYear.startDate,
      effectiveTo: null,
    },
  });

  const semester1 = await prisma.semester.upsert({
    where: { schoolYearId_name: { schoolYearId: schoolYear.id, name: 'HK1' } },
    update: {
      startDate: toDate('2025-09-01'),
      endDate: toDate('2026-01-15'),
      isActive: true,
    },
    create: {
      schoolYearId: schoolYear.id,
      name: 'HK1',
      startDate: toDate('2025-09-01'),
      endDate: toDate('2026-01-15'),
      isActive: true,
    },
  });

  await prisma.semester.upsert({
    where: { schoolYearId_name: { schoolYearId: schoolYear.id, name: 'HK2' } },
    update: {
      startDate: toDate('2026-01-16'),
      endDate: toDate('2026-05-30'),
      isActive: false,
    },
    create: {
      schoolYearId: schoolYear.id,
      name: 'HK2',
      startDate: toDate('2026-01-16'),
      endDate: toDate('2026-05-30'),
      isActive: false,
    },
  });

  const grade10 = await prisma.gradeLevel.upsert({
    where: { level: 10 },
    update: { name: '10', isActive: true },
    create: { name: '10', level: 10, isActive: true },
  });

  const math = await prisma.subject.upsert({
    where: { subjectCode: 'MATH' },
    update: { name: 'Toan', coefficient: 1, description: 'Mon Toan', isActive: true },
    create: {
      subjectCode: 'MATH',
      name: 'Toan',
      coefficient: 1,
      description: 'Mon Toan',
      isActive: true,
    },
  });

  const literature = await prisma.subject.upsert({
    where: { subjectCode: 'LIT' },
    update: { name: 'Van', coefficient: 1, description: 'Mon Van', isActive: true },
    create: {
      subjectCode: 'LIT',
      name: 'Van',
      coefficient: 1,
      description: 'Mon Van',
      isActive: true,
    },
  });

  const teacher01 = await prisma.teacher.upsert({
    where: { teacherCode: 'T001' },
    update: {
      fullName: 'Teacher 01',
      email: 'teacher01@school.com',
      phone: '0900000001',
      subjectId: math.id,
      status: 'ACTIVE',
    },
    create: {
      teacherCode: 'T001',
      fullName: 'Teacher 01',
      email: 'teacher01@school.com',
      phone: '0900000001',
      subjectId: math.id,
      status: 'ACTIVE',
    },
  });

  const teacher02 = await prisma.teacher.upsert({
    where: { teacherCode: 'T002' },
    update: {
      fullName: 'Teacher 02',
      email: 'teacher02@school.com',
      phone: '0900000002',
      subjectId: literature.id,
      status: 'ACTIVE',
    },
    create: {
      teacherCode: 'T002',
      fullName: 'Teacher 02',
      email: 'teacher02@school.com',
      phone: '0900000002',
      subjectId: literature.id,
      status: 'ACTIVE',
    },
  });

  const class10A1 = await prisma.class.upsert({
    where: { classCode: '10A1' },
    update: {
      name: '10A1',
      maxSize: 40,
      status: 'ACTIVE',
      gradeLevelId: grade10.id,
      schoolYearId: schoolYear.id,
      homeroomTeacherId: teacher01.id,
    },
    create: {
      classCode: '10A1',
      name: '10A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade10.id,
      schoolYearId: schoolYear.id,
      homeroomTeacherId: teacher01.id,
    },
  });

  const adminRole = roleByName.get('ADMIN');
  const academicStaffRole = roleByName.get('ACADEMIC_STAFF');
  const managerRole = roleByName.get('MANAGER');
  const teacherRole = roleByName.get('TEACHER');
  const studentRole = roleByName.get('STUDENT');
  if (!adminRole || !academicStaffRole || !managerRole || !teacherRole || !studentRole) {
    throw new Error('Missing seeded roles');
  }

>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { email: 'admin@school.edu.vn', passwordHash: hashedAdmin, fullName: 'Quản trị viên', roleId: adminRole.id, status: 'ACTIVE', studentId: null, teacherId: null },
    create: { username: 'admin', email: 'admin@school.edu.vn', passwordHash: hashedAdmin, fullName: 'Quản trị viên', roleId: adminRole.id, status: 'ACTIVE' },
  });

<<<<<<< HEAD
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
=======
  const academicStaffUser = await prisma.user.upsert({
    where: { username: 'giaovu01' },
    update: {
      email: 'giaovu01@school.com',
      passwordHash: hashedAcademicStaff,
      fullName: 'Academic Staff 01',
      roleId: academicStaffRole.id,
      status: 'ACTIVE',
      studentId: null,
      teacherId: null,
    },
    create: {
      username: 'giaovu01',
      email: 'giaovu01@school.com',
      passwordHash: hashedAcademicStaff,
      fullName: 'Academic Staff 01',
      roleId: academicStaffRole.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { username: 'manager01' },
    update: {
      email: 'manager01@school.com',
      passwordHash: hashedManager,
      fullName: 'Manager 01',
      roleId: managerRole.id,
      status: 'ACTIVE',
      studentId: null,
      teacherId: null,
    },
    create: {
      username: 'manager01',
      email: 'manager01@school.com',
      passwordHash: hashedManager,
      fullName: 'Manager 01',
      roleId: managerRole.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { username: 'teacher01' },
    update: {
      email: 'teacher01@school.com',
      passwordHash: hashedTeacher,
      fullName: 'Teacher 01',
      roleId: teacherRole.id,
      teacherId: teacher01.id,
      studentId: null,
      status: 'ACTIVE',
    },
    create: {
      username: 'teacher01',
      email: 'teacher01@school.com',
      passwordHash: hashedTeacher,
      fullName: 'Teacher 01',
      roleId: teacherRole.id,
      teacherId: teacher01.id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { username: 'teacher02' },
    update: {
      email: 'teacher02@school.com',
      passwordHash: hashedTeacher,
      fullName: 'Teacher 02',
      roleId: teacherRole.id,
      teacherId: teacher02.id,
      studentId: null,
      status: 'ACTIVE',
    },
    create: {
      username: 'teacher02',
      email: 'teacher02@school.com',
      passwordHash: hashedTeacher,
      fullName: 'Teacher 02',
      roleId: teacherRole.id,
      teacherId: teacher02.id,
      status: 'ACTIVE',
    },
  });

  const seedStudents: SeedStudent[] = [
    {
      code: 'S001',
      username: 'student01',
      email: 'student01@school.com',
      fullName: 'Student 01',
      gender: 'MALE',
      dateOfBirth: '2008-02-01',
    },
    {
      code: 'S002',
      username: 'student02',
      email: 'student02@school.com',
      fullName: 'Student 02',
      gender: 'FEMALE',
      dateOfBirth: '2008-06-12',
    },
    {
      code: 'S003',
      username: 'student03',
      email: 'student03@school.com',
      fullName: 'Student 03',
      gender: 'MALE',
      dateOfBirth: '2009-01-20',
    },
    {
      code: 'S004',
      username: 'student04',
      email: 'student04@school.com',
      fullName: 'Student 04',
      gender: 'FEMALE',
      dateOfBirth: '2009-04-08',
    },
    {
      code: 'S005',
      username: 'student05',
      email: 'student05@school.com',
      fullName: 'Student 05',
      gender: 'MALE',
      dateOfBirth: '2008-11-15',
    },
  ];

  const students: Array<{ id: number; studentCode: string }> = [];
  for (const item of seedStudents) {
    const student = await prisma.student.upsert({
      where: { studentCode: item.code },
      update: {
        fullName: item.fullName,
        gender: item.gender,
        dateOfBirth: toDate(item.dateOfBirth),
        admissionDate: toDate('2025-09-01'),
        address: 'TP.HCM',
        email: item.email,
        status: 'ACTIVE',
      },
      create: {
        studentCode: item.code,
        fullName: item.fullName,
        gender: item.gender,
        dateOfBirth: toDate(item.dateOfBirth),
        admissionDate: toDate('2025-09-01'),
        address: 'TP.HCM',
        email: item.email,
        status: 'ACTIVE',
        note: 'Demo student',
      },
    });
    students.push(student);

    await prisma.user.upsert({
      where: { username: item.username },
      update: {
        email: item.email,
        passwordHash: hashedStudent,
        fullName: item.fullName,
        roleId: studentRole.id,
        studentId: student.id,
        teacherId: null,
        status: 'ACTIVE',
      },
      create: {
        username: item.username,
        email: item.email,
        passwordHash: hashedStudent,
        fullName: item.fullName,
        roleId: studentRole.id,
        studentId: student.id,
        status: 'ACTIVE',
      },
    });

    const activeEnrollment = await prisma.studentClassEnrollment.findFirst({
      where: { studentId: student.id, semesterId: semester1.id, status: 'ACTIVE' },
    });

    if (activeEnrollment) {
      await prisma.studentClassEnrollment.update({
        where: { id: activeEnrollment.id },
        data: {
          classId: class10A1.id,
          status: 'ACTIVE',
          endedAt: null,
          reason: null,
        },
      });
    } else {
      await prisma.studentClassEnrollment.create({
        data: {
          studentId: student.id,
          classId: class10A1.id,
          semesterId: semester1.id,
          status: 'ACTIVE',
        },
      });
    }
  }

  const activeStudentCount = await prisma.studentClassEnrollment.count({
    where: { classId: class10A1.id, semesterId: semester1.id, status: 'ACTIVE' },
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
  });
  await prisma.class.update({
    where: { id: class10A1.id },
    data: { currentSize: activeStudentCount },
  });

<<<<<<< HEAD
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
=======
  const testTypes = await Promise.all([
    prisma.testType.upsert({
      where: { code: 'ORAL_15M' },
      update: { name: 'Oral/15m', defaultWeight: 1, isMultiple: true },
      create: { code: 'ORAL_15M', name: 'Oral/15m', defaultWeight: 1, isMultiple: true },
    }),
    prisma.testType.upsert({
      where: { code: 'ONE_PERIOD' },
      update: { name: 'One period', defaultWeight: 2, isMultiple: true },
      create: { code: 'ONE_PERIOD', name: 'One period', defaultWeight: 2, isMultiple: true },
    }),
    prisma.testType.upsert({
      where: { code: 'MIDTERM' },
      update: { name: 'Midterm', defaultWeight: 3, isMultiple: false },
      create: { code: 'MIDTERM', name: 'Midterm', defaultWeight: 3, isMultiple: false },
    }),
    prisma.testType.upsert({
      where: { code: 'FINAL' },
      update: { name: 'Final', defaultWeight: 3, isMultiple: false },
      create: { code: 'FINAL', name: 'Final', defaultWeight: 3, isMultiple: false },
    }),
  ]);
  const testTypeByCode = new Map(testTypes.map((testType) => [testType.code, testType]));

  for (const testType of testTypes) {
    const existing = await prisma.scoreWeight.findFirst({
      where: { schoolYearId: schoolYear.id, testTypeId: testType.id },
      orderBy: { effectiveFrom: 'desc' },
    });
    const data = {
      schoolYearId: schoolYear.id,
      testTypeId: testType.id,
      weight: testType.defaultWeight,
      effectiveFrom: schoolYear.startDate,
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
      effectiveTo: null,
    };
    if (existing) {
      await prisma.scoreWeight.update({ where: { id: existing.id }, data });
    } else {
      await prisma.scoreWeight.create({ data });
    }
  }

<<<<<<< HEAD
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
=======
  const upsertAssignment = async (data: {
    teacherId: number;
    classId: number;
    subjectId: number | null;
    schoolYearId: number;
    semesterId: number | null;
    assignmentType: TeacherAssignmentType;
  }) => {
    const existing = await prisma.teacherAssignment.findFirst({
      where: { ...data, isActive: true },
    });

    if (existing) {
      return prisma.teacherAssignment.update({
        where: { id: existing.id },
        data: { ...data, isActive: true, createdBy: academicStaffUser.id },
      });
    }

    return prisma.teacherAssignment.create({
      data: { ...data, isActive: true, createdBy: academicStaffUser.id },
    });
  };

  await upsertAssignment({
    teacherId: teacher01.id,
    classId: class10A1.id,
    subjectId: null,
    schoolYearId: schoolYear.id,
    semesterId: null,
    assignmentType: TeacherAssignmentType.HOMEROOM,
  });

  await upsertAssignment({
    teacherId: teacher01.id,
    classId: class10A1.id,
    subjectId: math.id,
    schoolYearId: schoolYear.id,
    semesterId: semester1.id,
    assignmentType: TeacherAssignmentType.SUBJECT,
  });

  await upsertAssignment({
    teacherId: teacher02.id,
    classId: class10A1.id,
    subjectId: literature.id,
    schoolYearId: schoolYear.id,
    semesterId: semester1.id,
    assignmentType: TeacherAssignmentType.SUBJECT,
  });

  const mathScores: ScoreInput[] = [
    { studentCode: 'S001', details: [{ code: 'ORAL_15M', score: 8 }, { code: 'ONE_PERIOD', score: 7.5 }, { code: 'MIDTERM', score: 8 }, { code: 'FINAL', score: 9 }] },
    { studentCode: 'S002', details: [{ code: 'ORAL_15M', score: 6.5 }, { code: 'ONE_PERIOD', score: 7 }, { code: 'MIDTERM', score: 7.5 }, { code: 'FINAL', score: 8 }] },
    { studentCode: 'S003', details: [{ code: 'ORAL_15M', score: 5 }, { code: 'ONE_PERIOD', score: 6 }, { code: 'MIDTERM', score: 6.5 }, { code: 'FINAL', score: 7 }] },
    { studentCode: 'S004', details: [{ code: 'ORAL_15M', score: 9 }, { code: 'ONE_PERIOD', score: 8.5 }, { code: 'MIDTERM', score: 8 }, { code: 'FINAL', score: 8.5 }] },
    { studentCode: 'S005', details: [{ code: 'ORAL_15M', score: 4.5 }, { code: 'ONE_PERIOD', score: 5 }, { code: 'MIDTERM', score: 5.5 }, { code: 'FINAL', score: 6 }] },
  ];

  const literatureScores: ScoreInput[] = [
    { studentCode: 'S001', details: [{ code: 'ORAL_15M', score: 7 }, { code: 'ONE_PERIOD', score: 7 }, { code: 'MIDTERM', score: 8 }, { code: 'FINAL', score: 8 }] },
    { studentCode: 'S002', details: [{ code: 'ORAL_15M', score: 8 }, { code: 'ONE_PERIOD', score: 8 }, { code: 'MIDTERM', score: 8.5 }, { code: 'FINAL', score: 8.5 }] },
    { studentCode: 'S003', details: [{ code: 'ORAL_15M', score: 6 }, { code: 'ONE_PERIOD', score: 6.5 }, { code: 'MIDTERM', score: 7 }, { code: 'FINAL', score: 7.5 }] },
    { studentCode: 'S004', details: [{ code: 'ORAL_15M', score: 5.5 }, { code: 'ONE_PERIOD', score: 6 }, { code: 'MIDTERM', score: 6 }, { code: 'FINAL', score: 6.5 }] },
    { studentCode: 'S005', details: [{ code: 'ORAL_15M', score: 7.5 }, { code: 'ONE_PERIOD', score: 7 }, { code: 'MIDTERM', score: 7 }, { code: 'FINAL', score: 8 }] },
  ];

  const studentByCode = new Map(students.map((student) => [student.studentCode, student]));

  const upsertScoreSheet = async (subjectId: number, scores: ScoreInput[]) => {
    const scoreSheet = await prisma.scoreSheet.upsert({
      where: {
        classId_subjectId_semesterId: {
          classId: class10A1.id,
          subjectId,
          semesterId: semester1.id,
        },
      },
      update: { status: ScoreSheetStatus.DRAFT },
      create: {
        classId: class10A1.id,
        subjectId,
        semesterId: semester1.id,
        status: ScoreSheetStatus.DRAFT,
        createdBy: academicStaffUser.id,
      },
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
    });

<<<<<<< HEAD
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
=======
    for (const scoreInput of scores) {
      const student = studentByCode.get(scoreInput.studentCode);
      if (!student) {
        throw new Error(`Missing student ${scoreInput.studentCode}`);
      }

      const averageScore = calculateAverage(scoreInput.details);
      const studentSubjectScore = await prisma.studentSubjectScore.upsert({
        where: {
          scoreSheetId_studentId: {
            scoreSheetId: scoreSheet.id,
            studentId: student.id,
          },
        },
        update: {
          averageScore,
          passStatus: averageScore >= 5,
          calculatedAt: new Date(),
        },
        create: {
          scoreSheetId: scoreSheet.id,
          studentId: student.id,
          averageScore,
          passStatus: averageScore >= 5,
          calculatedAt: new Date(),
        },
      });

      for (const detail of scoreInput.details) {
        const testType = testTypeByCode.get(detail.code);
        if (!testType) {
          throw new Error(`Missing test type ${detail.code}`);
        }

        await prisma.scoreDetail.upsert({
          where: {
            studentSubjectScoreId_testTypeId_attemptNo: {
              studentSubjectScoreId: studentSubjectScore.id,
              testTypeId: testType.id,
              attemptNo: detail.attemptNo ?? 1,
            },
          },
          update: {
            score: detail.score,
            weightSnapshot: testType.defaultWeight,
          },
          create: {
            studentSubjectScoreId: studentSubjectScore.id,
            testTypeId: testType.id,
            attemptNo: detail.attemptNo ?? 1,
            score: detail.score,
            weightSnapshot: testType.defaultWeight,
          },
        });
      }
    }
  };

  await upsertScoreSheet(math.id, mathScores);
  await upsertScoreSheet(literature.id, literatureScores);

  console.log('Seed completed successfully.');
  console.log(`- Admin:          username=admin       password=${seedAdminPassword}`);
  console.log(`- Academic staff: username=giaovu01    password=${seedAcademicStaffPassword}`);
  console.log(`- Manager:        username=manager01   password=${seedManagerPassword}`);
  console.log(`- Teacher:        username=teacher01   password=${seedTeacherPassword}`);
  console.log(`- Teacher:        username=teacher02   password=${seedTeacherPassword}`);
  console.log(`- Students:       username=student01..student05 password=${seedStudentPassword}`);
  console.log(`- Class:          ${class10A1.name} (${schoolYear.name}, ${semester1.name})`);
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
<<<<<<< HEAD
  });
=======
  });
>>>>>>> 4309e1f055dc7b9ef580ac3e8e344fe6609da583
