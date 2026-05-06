import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
const seedTeacherPassword = process.env.SEED_TEACHER_PASSWORD ?? 'Teacher@123';
const seedStudentPassword = process.env.SEED_STUDENT_PASSWORD ?? 'Student@123';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toDate(date: string) {
  // Force UTC to avoid timezone differences between machines.
  return new Date(`${date}T00:00:00.000Z`);
}

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, saltRounds);
}

async function main() {
  console.log('Seeding demo data (idempotent)...');

  const [hashedAdmin, hashedTeacher, hashedStudent] = await Promise.all([
    hashPassword(seedAdminPassword),
    hashPassword(seedTeacherPassword),
    hashPassword(seedStudentPassword),
  ]);

  // ========================
  // 1) Roles
  // ========================
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'TEACHER' },
    update: {},
    create: { name: 'TEACHER' },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: { name: 'STUDENT' },
  });

  // ========================
  // 2) SchoolYear + SystemParameter + Semester
  // ========================
  const schoolYearsData = [
    {
      name: '2025-2026',
      startYear: 2025,
      endYear: 2026,
      startDate: '2025-09-01',
      endDate: '2026-05-30',
      isActive: true,
    },
    {
      name: '2024-2025',
      startYear: 2024,
      endYear: 2025,
      startDate: '2024-09-01',
      endDate: '2025-05-30',
      isActive: false,
    },
  ];

  const schoolYears: Array<{
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }> = [];

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

  // SystemParameter has no unique constraint, so we implement an "upsert-like" behavior manually
  // (one record per schoolYear).
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
      await prisma.systemParameter.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.systemParameter.create({ data });
    }
  }

  const semestersByYear = new Map<number, { hk1: any; hk2: any }>();

  for (const sy of schoolYears) {
    const hk1 = await prisma.semester.upsert({
      where: { schoolYearId_name: { schoolYearId: sy.id, name: 'HK1' } },
      update: {
        startDate: toDate(sy.isActive ? '2025-09-01' : '2024-09-01'),
        endDate: toDate(sy.isActive ? '2026-01-15' : '2025-01-15'),
        isActive: sy.isActive,
      },
      create: {
        schoolYearId: sy.id,
        name: 'HK1',
        startDate: toDate(sy.isActive ? '2025-09-01' : '2024-09-01'),
        endDate: toDate(sy.isActive ? '2026-01-15' : '2025-01-15'),
        isActive: sy.isActive,
      },
    });

    const hk2Start = sy.isActive ? '2026-01-16' : '2025-01-16';
    const hk2End = sy.isActive ? '2026-05-30' : '2025-05-30';
    const hk2 = await prisma.semester.upsert({
      where: { schoolYearId_name: { schoolYearId: sy.id, name: 'HK2' } },
      update: {
        startDate: toDate(hk2Start),
        endDate: toDate(hk2End),
        isActive: sy.isActive,
      },
      create: {
        schoolYearId: sy.id,
        name: 'HK2',
        startDate: toDate(hk2Start),
        endDate: toDate(hk2End),
        isActive: sy.isActive,
      },
    });

    semestersByYear.set(sy.id, { hk1, hk2 });
  }

  // ========================
  // 3) Grade Levels
  // ========================
  const grade10 = await prisma.gradeLevel.upsert({
    where: { name: '10' },
    update: { level: 10, isActive: true },
    create: { name: '10', level: 10, isActive: true },
  });

  const grade11 = await prisma.gradeLevel.upsert({
    where: { name: '11' },
    update: { level: 11, isActive: true },
    create: { name: '11', level: 11, isActive: true },
  });

  const grade12 = await prisma.gradeLevel.upsert({
    where: { name: '12' },
    update: { level: 12, isActive: true },
    create: { name: '12', level: 12, isActive: true },
  });

  // ========================
  // 4) Subjects
  // ========================
  const math = await prisma.subject.upsert({
    where: { subjectCode: 'MATH' },
    update: { name: 'Toán', coefficient: 1, description: 'Môn Toán', isActive: true },
    create: {
      subjectCode: 'MATH',
      name: 'Toán',
      coefficient: 1,
      description: 'Môn Toán',
      isActive: true,
    },
  });

  await prisma.subject.upsert({
    where: { subjectCode: 'PHYS' },
    update: {
      name: 'Lý',
      coefficient: 1,
      description: 'Môn Lý',
      isActive: true,
    },
    create: {
      subjectCode: 'PHYS',
      name: 'Lý',
      coefficient: 1,
      description: 'Môn Lý',
      isActive: true,
    },
  });

  await prisma.subject.upsert({
    where: { subjectCode: 'CHEM' },
    update: {
      name: 'Hóa',
      coefficient: 1,
      description: 'Môn Hóa',
      isActive: true,
    },
    create: {
      subjectCode: 'CHEM',
      name: 'Hóa',
      coefficient: 1,
      description: 'Môn Hóa',
      isActive: true,
    },
  });

  // Additional subjects needed by docs' "seed tối thiểu"
  await prisma.subject.upsert({
    where: { subjectCode: 'LIT' },
    update: { name: 'Văn', coefficient: 1, description: 'Môn Văn', isActive: true },
    create: { subjectCode: 'LIT', name: 'Văn', coefficient: 1, description: 'Môn Văn', isActive: true },
  });

  await prisma.subject.upsert({
    where: { subjectCode: 'ENG' },
    update: { name: 'Anh', coefficient: 1, description: 'Môn Anh', isActive: true },
    create: { subjectCode: 'ENG', name: 'Anh', coefficient: 1, description: 'Môn Anh', isActive: true },
  });

  const biology = await prisma.subject.upsert({
    where: { subjectCode: 'BIO' },
    update: { name: 'Sinh', coefficient: 1, description: 'Môn Sinh', isActive: true },
    create: { subjectCode: 'BIO', name: 'Sinh', coefficient: 1, description: 'Môn Sinh', isActive: true },
  });

  await prisma.subject.upsert({
    where: { subjectCode: 'HIST' },
    update: { name: 'Sử', coefficient: 1, description: 'Môn Sử', isActive: true },
    create: { subjectCode: 'HIST', name: 'Sử', coefficient: 1, description: 'Môn Sử', isActive: true },
  });

  await prisma.subject.upsert({
    where: { subjectCode: 'GEO' },
    update: { name: 'Địa', coefficient: 1, description: 'Môn Địa', isActive: true },
    create: { subjectCode: 'GEO', name: 'Địa', coefficient: 1, description: 'Môn Địa', isActive: true },
  });

  // ========================
  // 5) Teacher + Teacher User
  // ========================
  const teacher = await prisma.teacher.upsert({
    where: { teacherCode: 'T001' },
    update: {
      fullName: 'Giáo viên 1',
      email: 'teacher01@school.com',
      phone: '0900000001',
      subjectId: math.id,
      status: 'ACTIVE',
    },
    create: {
      teacherCode: 'T001',
      fullName: 'Giáo viên 1',
      email: 'teacher01@school.com',
      phone: '0900000001',
      subjectId: math.id,
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
      teacherId: teacher.id,
      status: 'ACTIVE',
    },
    create: {
      username: 'teacher01',
      email: 'teacher01@school.com',
      passwordHash: hashedTeacher,
      fullName: 'Teacher 01',
      roleId: teacherRole.id,
      teacherId: teacher.id,
      status: 'ACTIVE',
    },
  });

  // ========================
  // 6) Student + Student User
  // ========================
  const student = await prisma.student.upsert({
    where: { studentCode: 'S001' },
    update: {
      fullName: 'Học sinh 1',
      gender: 'MALE',
      dateOfBirth: toDate('2008-02-01'),
      admissionDate: toDate('2025-09-01'),
      address: 'Quận 1, TP.HCM',
      email: 'student01@school.com',
      status: 'ACTIVE',
    },
    create: {
      studentCode: 'S001',
      fullName: 'Học sinh 1',
      gender: 'MALE',
      dateOfBirth: toDate('2008-02-01'),
      admissionDate: toDate('2025-09-01'),
      address: 'Quận 1, TP.HCM',
      email: 'student01@school.com',
      status: 'ACTIVE',
      note: 'Demo account',
    },
  });

  await prisma.user.upsert({
    where: { username: 'student01' },
    update: {
      email: 'student01@school.com',
      passwordHash: hashedStudent,
      fullName: 'Student 01',
      roleId: studentRole.id,
      studentId: student.id,
      status: 'ACTIVE',
    },
    create: {
      username: 'student01',
      email: 'student01@school.com',
      passwordHash: hashedStudent,
      fullName: 'Student 01',
      roleId: studentRole.id,
      studentId: student.id,
      status: 'ACTIVE',
    },
  });

  // ========================
  // 7) Admin User
  // ========================
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@school.com',
      passwordHash: hashedAdmin,
      fullName: 'System Admin',
      roleId: adminRole.id,
      status: 'ACTIVE',
      studentId: null,
      teacherId: null,
    },
    create: {
      username: 'admin',
      email: 'admin@school.com',
      passwordHash: hashedAdmin,
      fullName: 'System Admin',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });

  // ========================
  // 8) Classes & Enrollment
  // ========================
  const activeSchoolYear = schoolYears.find((y) => y.isActive) ?? schoolYears[0];
  const hk1 = (semestersByYear.get(activeSchoolYear.id) ?? semestersByYear.values().next().value).hk1;

  const class10A1 = await prisma.class.upsert({
    where: { classCode: '10A1' },
    update: {
      name: '10A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade10.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
    create: {
      classCode: '10A1',
      name: '10A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade10.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
  });

  await prisma.class.upsert({
    where: { classCode: '10A2' },
    update: {
      name: '10A2',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade10.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
    create: {
      classCode: '10A2',
      name: '10A2',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade10.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
  });

  await prisma.class.upsert({
    where: { classCode: '11A1' },
    update: {
      name: '11A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade11.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
    create: {
      classCode: '11A1',
      name: '11A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade11.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
  });

  await prisma.class.upsert({
    where: { classCode: '12A1' },
    update: {
      name: '12A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade12.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
    create: {
      classCode: '12A1',
      name: '12A1',
      maxSize: 40,
      currentSize: 0,
      status: 'ACTIVE',
      gradeLevelId: grade12.id,
      schoolYearId: activeSchoolYear.id,
      homeroomTeacherId: teacher.id,
    },
  });

  await prisma.studentClassEnrollment.upsert({
    where: {
      studentId_semesterId: {
        studentId: student.id,
        semesterId: hk1.id,
      },
    },
    update: {
      classId: class10A1.id,
      status: 'ACTIVE',
      semesterAverage: null,
    },
    create: {
      studentId: student.id,
      classId: class10A1.id,
      semesterId: hk1.id,
      semesterAverage: null,
      status: 'ACTIVE',
    },
  });

  // Keep class currentSize consistent with enrollments.
  const enrolledCount = await prisma.studentClassEnrollment.count({
    where: { classId: class10A1.id, status: 'ACTIVE' },
  });
  await prisma.class.update({
    where: { id: class10A1.id },
    data: { currentSize: enrolledCount },
  });

  // ========================
  // 9) TestTypes + ScoreWeights (phục vụ demo nhập điểm)
  // ========================
  const testTypes = await Promise.all([
    prisma.testType.upsert({
      where: { code: 'ORAL_15M' },
      update: { name: 'Miệng/15 phút', defaultWeight: 1, isMultiple: true },
      create: { code: 'ORAL_15M', name: 'Miệng/15 phút', defaultWeight: 1, isMultiple: true },
    }),
    prisma.testType.upsert({
      where: { code: 'ONE_PERIOD' },
      update: { name: '1 tiết', defaultWeight: 2, isMultiple: true },
      create: { code: 'ONE_PERIOD', name: '1 tiết', defaultWeight: 2, isMultiple: true },
    }),
    prisma.testType.upsert({
      where: { code: 'MIDTERM' },
      update: { name: 'Giữa kỳ', defaultWeight: 3, isMultiple: false },
      create: { code: 'MIDTERM', name: 'Giữa kỳ', defaultWeight: 3, isMultiple: false },
    }),
    prisma.testType.upsert({
      where: { code: 'FINAL' },
      update: { name: 'Cuối kỳ', defaultWeight: 3, isMultiple: false },
      create: { code: 'FINAL', name: 'Cuối kỳ', defaultWeight: 3, isMultiple: false },
    }),
  ]);

  // ScoreWeight không có unique constraint => upsert-like
  for (const tt of testTypes) {
    const existing = await prisma.scoreWeight.findFirst({
      where: { schoolYearId: activeSchoolYear.id, testTypeId: tt.id },
      orderBy: { effectiveFrom: 'desc' },
    });

    const data = {
      schoolYearId: activeSchoolYear.id,
      testTypeId: tt.id,
      weight: tt.defaultWeight,
      effectiveFrom: activeSchoolYear.startDate,
      effectiveTo: null,
    };

    if (existing) {
      await prisma.scoreWeight.update({ where: { id: existing.id }, data });
    } else {
      await prisma.scoreWeight.create({ data });
    }
  }

  // ========================
  // 10) TeacherAssignment + ScoreSheet (demo nhập điểm)
  // ========================
  const scoreSemester = hk1;
  const mathSubject = math;

  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_semesterId: {
        teacherId: teacher.id,
        classId: class10A1.id,
        subjectId: mathSubject.id,
        semesterId: scoreSemester.id,
      },
    },
    update: { assignmentType: 'TEACHING' },
    create: {
      teacherId: teacher.id,
      classId: class10A1.id,
      subjectId: mathSubject.id,
      semesterId: scoreSemester.id,
      assignmentType: 'TEACHING',
    },
  });

  const scoreSheet = await prisma.scoreSheet.upsert({
    where: { classId_subjectId_semesterId: { classId: class10A1.id, subjectId: mathSubject.id, semesterId: scoreSemester.id } },
    update: { status: 'DRAFT' },
    create: {
      classId: class10A1.id,
      subjectId: mathSubject.id,
      semesterId: scoreSemester.id,
      status: 'DRAFT',
    },
  });

  const studentSubjectScore = await prisma.studentSubjectScore.upsert({
    where: { scoreSheetId_studentId: { scoreSheetId: scoreSheet.id, studentId: student.id } },
    update: { averageScore: null, passStatus: null },
    create: { scoreSheetId: scoreSheet.id, studentId: student.id, averageScore: null, passStatus: null },
  });

  // Seed a few score details within 0-10 for the demo.
  const scoreDetailInputs: Array<{ code: string; score: number }> = [
    { code: 'ORAL_15M', score: 8.0 },
    { code: 'ONE_PERIOD', score: 7.5 },
    { code: 'MIDTERM', score: 8.0 },
    { code: 'FINAL', score: 9.0 },
  ];

  for (const item of scoreDetailInputs) {
    const tt = testTypes.find((t) => t.code === item.code);
    if (!tt) continue;

    const sw = await prisma.scoreWeight.findFirst({
      where: { schoolYearId: activeSchoolYear.id, testTypeId: tt.id },
      orderBy: { effectiveFrom: 'desc' },
    });

    await prisma.scoreDetail.upsert({
      where: {
        studentSubjectScoreId_testTypeId_attemptNo: {
          studentSubjectScoreId: studentSubjectScore.id,
          testTypeId: tt.id,
          attemptNo: 1,
        },
      },
      update: {
        score: item.score,
        weightSnapshot: sw?.weight ?? tt.defaultWeight,
      },
      create: {
        studentSubjectScoreId: studentSubjectScore.id,
        testTypeId: tt.id,
        attemptNo: 1,
        score: item.score,
        weightSnapshot: sw?.weight ?? tt.defaultWeight,
      },
    });
  }

  console.log('✅ Seed completed successfully.');
  console.log(`- Admin:     username=admin       password=${seedAdminPassword}`);
  console.log(`- Teacher:   username=teacher01   password=${seedTeacherPassword}`);
  console.log(`- Student:   username=student01   password=${seedStudentPassword}`);
  console.log(`- Class:     ${class10A1.name} (semester=HK1)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
