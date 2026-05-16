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

const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
const seedAcademicStaffPassword = process.env.SEED_ACADEMIC_STAFF_PASSWORD ?? 'Staff@123';
const seedManagerPassword = process.env.SEED_MANAGER_PASSWORD ?? 'Manager@123';
const seedTeacherPassword = process.env.SEED_TEACHER_PASSWORD ?? 'Teacher@123';
const seedStudentPassword = process.env.SEED_STUDENT_PASSWORD ?? 'Student@123';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  return new Date(`${date}T00:00:00.000Z`);
}

async function hashPassword(plain: string) {
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

  const [hashedAdmin, hashedAcademicStaff, hashedManager, hashedTeacher, hashedStudent] =
    await Promise.all([
      hashPassword(seedAdminPassword),
      hashPassword(seedAcademicStaffPassword),
      hashPassword(seedManagerPassword),
      hashPassword(seedTeacherPassword),
      hashPassword(seedStudentPassword),
    ]);

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
      name: '2025-2026',
      startYear: 2025,
      endYear: 2026,
      startDate: toDate('2025-09-01'),
      endDate: toDate('2026-05-30'),
      isActive: true,
    },
  });

  await prisma.systemParameter.upsert({
    where: { schoolYearId: schoolYear.id },
    update: {
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
  });
  await prisma.class.update({
    where: { id: class10A1.id },
    data: { currentSize: activeStudentCount },
  });

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
      effectiveTo: null,
    };

    if (existing) {
      await prisma.scoreWeight.update({ where: { id: existing.id }, data });
    } else {
      await prisma.scoreWeight.create({ data });
    }
  }

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
    });

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
