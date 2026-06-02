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
if (!connectionString) throw new Error('DATABASE_URL is not set');

const seedAdminPassword         = process.env.SEED_ADMIN_PASSWORD          ?? 'Admin@123';
const seedAcademicStaffPassword = process.env.SEED_ACADEMIC_STAFF_PASSWORD  ?? 'Staff@123';
const seedManagerPassword       = process.env.SEED_MANAGER_PASSWORD         ?? 'Manager@123';
const seedTeacherPassword       = process.env.SEED_TEACHER_PASSWORD         ?? 'Teacher@123';
const seedStudentPassword       = process.env.SEED_STUDENT_PASSWORD         ?? 'Student@123';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function toDate(s: string) { return new Date(`${s}T00:00:00.000Z`); }
async function hashPw(p: string) { return bcrypt.hash(p, saltRounds); }

/** Deterministic score based on performance level + positional variance. */
function genScore(perf: 1|2|3|4|5, sIdx: number, subIdx: number, testCode: string): number {
  const base = ({ 1: 3.5, 2: 5.1, 3: 6.5, 4: 7.8, 5: 9.1 } as Record<number, number>)[perf] ?? 6.5;
  const seed = (sIdx * 17 + subIdx * 11 + testCode.length * 5) % 20;
  const noise = (seed - 10) * 0.07;
  return Math.min(10, Math.max(0, Math.round((base + noise) * 10) / 10));
}

function calcAvg(oral: number, onePeriod: number, midterm: number, final: number) {
  return Math.round(((oral * 1 + onePeriod * 2 + midterm * 3 + final * 3) / 9) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────
const SUBJECT_DEFS = [
  { code: 'MATH', name: 'Toán',       coefficient: 1 },
  { code: 'LIT',  name: 'Ngữ văn',    coefficient: 1 },
  { code: 'ENG',  name: 'Tiếng Anh',  coefficient: 1 },
  { code: 'PHY',  name: 'Vật lý',     coefficient: 1 },
  { code: 'CHEM', name: 'Hóa học',    coefficient: 1 },
] as const;

const TEACHER_DEFS = [
  { code: 'T001', username: 'teacher01', fullName: 'Nguyễn Tuấn An',     email: 'teacher01@school.com', phone: '0901000001', subjectCode: 'MATH', homeroomClass: '10A1' },
  { code: 'T002', username: 'teacher02', fullName: 'Trần Thị Bích Ngọc', email: 'teacher02@school.com', phone: '0901000002', subjectCode: 'LIT',  homeroomClass: '10A2' },
  { code: 'T003', username: 'teacher03', fullName: 'Lê Văn Cường',       email: 'teacher03@school.com', phone: '0901000003', subjectCode: 'ENG',  homeroomClass: '11A1' },
  { code: 'T004', username: 'teacher04', fullName: 'Phạm Thị Duyên',     email: 'teacher04@school.com', phone: '0901000004', subjectCode: 'PHY',  homeroomClass: '12A1' },
  { code: 'T005', username: 'teacher05', fullName: 'Hoàng Minh Đức',     email: 'teacher05@school.com', phone: '0901000005', subjectCode: 'CHEM', homeroomClass: null   },
] as const;

type SeedStudent = {
  code: string; username?: string; email: string;
  fullName: string; gender: 'MALE'|'FEMALE';
  dob: string; admDate: string;
  classCode?: string; perf: 1|2|3|4|5;
};

// 10A1 = 20 students | 10A2 = 15 | 11A1 = 15 | 11A2 = 12 | 12A1 = 8 | pending = 3
const STUDENTS: SeedStudent[] = [
  // ── 10A1 (S001-S005 have login accounts) ───────────────────────────────────
  { code:'S001', username:'student01', email:'student01@school.com', fullName:'Nguyễn Văn An',      gender:'MALE',   dob:'2009-02-01', admDate:'2025-09-01', classCode:'10A1', perf:4 },
  { code:'S002', username:'student02', email:'student02@school.com', fullName:'Trần Thị Bình',      gender:'FEMALE', dob:'2009-06-12', admDate:'2025-09-01', classCode:'10A1', perf:5 },
  { code:'S003', username:'student03', email:'student03@school.com', fullName:'Lê Minh Châu',       gender:'MALE',   dob:'2009-01-20', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S004', username:'student04', email:'student04@school.com', fullName:'Phạm Thu Dung',      gender:'FEMALE', dob:'2009-04-08', admDate:'2025-09-01', classCode:'10A1', perf:4 },
  { code:'S005', username:'student05', email:'student05@school.com', fullName:'Hoàng Gia Huy',      gender:'MALE',   dob:'2009-11-15', admDate:'2025-09-01', classCode:'10A1', perf:2 },
  { code:'S101', email:'s101@school.com', fullName:'Phan Thị Diễm',  gender:'FEMALE', dob:'2009-03-18', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S102', email:'s102@school.com', fullName:'Mai Văn Hùng',   gender:'MALE',   dob:'2009-09-09', admDate:'2025-09-01', classCode:'10A1', perf:4 },
  { code:'S103', email:'s103@school.com', fullName:'Vũ Thị Kim',     gender:'FEMALE', dob:'2009-07-22', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S104', email:'s104@school.com', fullName:'Dương Hữu Lộc',  gender:'MALE',   dob:'2009-12-05', admDate:'2025-09-01', classCode:'10A1', perf:1 },
  { code:'S105', email:'s105@school.com', fullName:'Ngô Thị Mỹ',     gender:'FEMALE', dob:'2009-08-14', admDate:'2025-09-01', classCode:'10A1', perf:5 },
  { code:'S106', email:'s106@school.com', fullName:'Đinh Văn Nghĩa', gender:'MALE',   dob:'2009-05-30', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S107', email:'s107@school.com', fullName:'Lý Thu Oanh',    gender:'FEMALE', dob:'2009-10-17', admDate:'2025-09-01', classCode:'10A1', perf:4 },
  { code:'S108', email:'s108@school.com', fullName:'Phan Văn Phúc',  gender:'MALE',   dob:'2009-02-28', admDate:'2025-09-01', classCode:'10A1', perf:2 },
  { code:'S109', email:'s109@school.com', fullName:'Cao Thị Quyên',  gender:'FEMALE', dob:'2009-06-03', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S110', email:'s110@school.com', fullName:'Trịnh Quang Rạng',gender:'MALE',  dob:'2009-01-11', admDate:'2025-09-01', classCode:'10A1', perf:4 },
  { code:'S111', email:'s111@school.com', fullName:'Nguyễn Thị Sơn', gender:'FEMALE', dob:'2009-04-25', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S112', email:'s112@school.com', fullName:'Lê Hoàng Tâm',   gender:'MALE',   dob:'2009-09-08', admDate:'2025-09-01', classCode:'10A1', perf:5 },
  { code:'S113', email:'s113@school.com', fullName:'Bùi Minh Uy',    gender:'MALE',   dob:'2009-03-14', admDate:'2025-09-01', classCode:'10A1', perf:3 },
  { code:'S114', email:'s114@school.com', fullName:'Phạm Thị Vân',   gender:'FEMALE', dob:'2009-07-19', admDate:'2025-09-01', classCode:'10A1', perf:4 },
  { code:'S115', email:'s115@school.com', fullName:'Trần Văn Xương',  gender:'MALE',   dob:'2009-11-23', admDate:'2025-09-01', classCode:'10A1', perf:1 },

  // ── 10A2 (S007 has login account) ──────────────────────────────────────────
  { code:'S007', username:'student07', email:'student07@school.com', fullName:'Bùi Quốc Minh',     gender:'MALE',   dob:'2009-09-09', admDate:'2025-09-01', classCode:'10A2', perf:3 },
  { code:'S201', email:'s201@school.com', fullName:'Lưu Thị Mai',    gender:'FEMALE', dob:'2009-03-22', admDate:'2025-09-01', classCode:'10A2', perf:4 },
  { code:'S202', email:'s202@school.com', fullName:'Nguyễn Hoàng Nam',gender:'MALE',  dob:'2009-07-14', admDate:'2025-09-01', classCode:'10A2', perf:3 },
  { code:'S203', email:'s203@school.com', fullName:'Trương Thị Oanh', gender:'FEMALE', dob:'2009-11-28', admDate:'2025-09-01', classCode:'10A2', perf:5 },
  { code:'S204', email:'s204@school.com', fullName:'Đinh Văn Phú',   gender:'MALE',   dob:'2009-04-02', admDate:'2025-09-01', classCode:'10A2', perf:2 },
  { code:'S205', email:'s205@school.com', fullName:'Đặng Thị Quyên', gender:'FEMALE', dob:'2009-08-16', admDate:'2025-09-01', classCode:'10A2', perf:3 },
  { code:'S206', email:'s206@school.com', fullName:'Hồ Minh Quân',   gender:'MALE',   dob:'2009-01-30', admDate:'2025-09-01', classCode:'10A2', perf:4 },
  { code:'S207', email:'s207@school.com', fullName:'Võ Thị Rạng',    gender:'FEMALE', dob:'2009-06-11', admDate:'2025-09-01', classCode:'10A2', perf:3 },
  { code:'S208', email:'s208@school.com', fullName:'Cao Văn Sáng',   gender:'MALE',   dob:'2009-12-05', admDate:'2025-09-01', classCode:'10A2', perf:1 },
  { code:'S209', email:'s209@school.com', fullName:'Lý Thị Tâm',     gender:'FEMALE', dob:'2009-03-19', admDate:'2025-09-01', classCode:'10A2', perf:4 },
  { code:'S210', email:'s210@school.com', fullName:'Vũ Hoàng Thắng', gender:'MALE',   dob:'2009-09-27', admDate:'2025-09-01', classCode:'10A2', perf:3 },
  { code:'S211', email:'s211@school.com', fullName:'Dương Thị Thu',  gender:'FEMALE', dob:'2009-05-08', admDate:'2025-09-01', classCode:'10A2', perf:5 },
  { code:'S212', email:'s212@school.com', fullName:'Bùi Văn Tín',    gender:'MALE',   dob:'2009-07-23', admDate:'2025-09-01', classCode:'10A2', perf:2 },
  { code:'S213', email:'s213@school.com', fullName:'Nguyễn Thị Vân', gender:'FEMALE', dob:'2009-02-14', admDate:'2025-09-01', classCode:'10A2', perf:3 },
  { code:'S214', email:'s214@school.com', fullName:'Trần Minh Vương', gender:'MALE',  dob:'2009-10-31', admDate:'2025-09-01', classCode:'10A2', perf:4 },

  // ── 11A1 ───────────────────────────────────────────────────────────────────
  { code:'S301', email:'s301@school.com', fullName:'Lê Thị Ánh',      gender:'FEMALE', dob:'2008-01-15', admDate:'2024-09-01', classCode:'11A1', perf:5 },
  { code:'S302', email:'s302@school.com', fullName:'Nguyễn Văn Bắc',  gender:'MALE',   dob:'2008-06-08', admDate:'2024-09-01', classCode:'11A1', perf:4 },
  { code:'S303', email:'s303@school.com', fullName:'Trần Thị Cúc',    gender:'FEMALE', dob:'2008-03-22', admDate:'2024-09-01', classCode:'11A1', perf:3 },
  { code:'S304', email:'s304@school.com', fullName:'Phạm Văn Dũng',   gender:'MALE',   dob:'2008-09-14', admDate:'2024-09-01', classCode:'11A1', perf:4 },
  { code:'S305', email:'s305@school.com', fullName:'Đặng Thị Én',     gender:'FEMALE', dob:'2008-11-30', admDate:'2024-09-01', classCode:'11A1', perf:2 },
  { code:'S306', email:'s306@school.com', fullName:'Hồ Văn Giang',    gender:'MALE',   dob:'2008-04-17', admDate:'2024-09-01', classCode:'11A1', perf:3 },
  { code:'S307', email:'s307@school.com', fullName:'Ngô Thị Hằng',    gender:'FEMALE', dob:'2008-07-25', admDate:'2024-09-01', classCode:'11A1', perf:5 },
  { code:'S308', email:'s308@school.com', fullName:'Lý Văn Hiếu',     gender:'MALE',   dob:'2008-02-10', admDate:'2024-09-01', classCode:'11A1', perf:3 },
  { code:'S309', email:'s309@school.com', fullName:'Bùi Thị Hoa',     gender:'FEMALE', dob:'2008-08-03', admDate:'2024-09-01', classCode:'11A1', perf:4 },
  { code:'S310', email:'s310@school.com', fullName:'Đinh Văn Hòa',    gender:'MALE',   dob:'2008-12-21', admDate:'2024-09-01', classCode:'11A1', perf:1 },
  { code:'S311', email:'s311@school.com', fullName:'Phan Thị Hương',  gender:'FEMALE', dob:'2008-05-16', admDate:'2024-09-01', classCode:'11A1', perf:3 },
  { code:'S312', email:'s312@school.com', fullName:'Trịnh Văn Kiên',  gender:'MALE',   dob:'2008-10-09', admDate:'2024-09-01', classCode:'11A1', perf:4 },
  { code:'S313', email:'s313@school.com', fullName:'Vũ Thị Lài',      gender:'FEMALE', dob:'2008-01-28', admDate:'2024-09-01', classCode:'11A1', perf:3 },
  { code:'S314', email:'s314@school.com', fullName:'Dương Văn Lộc',   gender:'MALE',   dob:'2008-06-13', admDate:'2024-09-01', classCode:'11A1', perf:2 },
  { code:'S315', email:'s315@school.com', fullName:'Cao Thị Lụa',     gender:'FEMALE', dob:'2008-03-05', admDate:'2024-09-01', classCode:'11A1', perf:4 },

  // ── 11A2 (enrolled, không có bảng điểm – demo lớp mới) ───────────────────
  { code:'S401', email:'s401@school.com', fullName:'Lê Văn Mạnh',     gender:'MALE',   dob:'2008-02-18', admDate:'2024-09-01', classCode:'11A2', perf:3 },
  { code:'S402', email:'s402@school.com', fullName:'Nguyễn Thị Ngần', gender:'FEMALE', dob:'2008-07-04', admDate:'2024-09-01', classCode:'11A2', perf:4 },
  { code:'S403', email:'s403@school.com', fullName:'Trần Văn Nghị',   gender:'MALE',   dob:'2008-11-22', admDate:'2024-09-01', classCode:'11A2', perf:2 },
  { code:'S404', email:'s404@school.com', fullName:'Phạm Thị Ngọc',   gender:'FEMALE', dob:'2008-04-30', admDate:'2024-09-01', classCode:'11A2', perf:5 },
  { code:'S405', email:'s405@school.com', fullName:'Đặng Văn Ninh',   gender:'MALE',   dob:'2008-08-15', admDate:'2024-09-01', classCode:'11A2', perf:3 },
  { code:'S406', email:'s406@school.com', fullName:'Hồ Thị Nở',       gender:'FEMALE', dob:'2008-01-26', admDate:'2024-09-01', classCode:'11A2', perf:3 },
  { code:'S407', email:'s407@school.com', fullName:'Ngô Văn Phong',   gender:'MALE',   dob:'2008-06-09', admDate:'2024-09-01', classCode:'11A2', perf:4 },
  { code:'S408', email:'s408@school.com', fullName:'Lý Thị Quý',      gender:'FEMALE', dob:'2008-10-03', admDate:'2024-09-01', classCode:'11A2', perf:3 },
  { code:'S409', email:'s409@school.com', fullName:'Bùi Văn Quý',     gender:'MALE',   dob:'2008-03-14', admDate:'2024-09-01', classCode:'11A2', perf:2 },
  { code:'S410', email:'s410@school.com', fullName:'Đinh Thị Rộng',   gender:'FEMALE', dob:'2008-09-28', admDate:'2024-09-01', classCode:'11A2', perf:4 },
  { code:'S411', email:'s411@school.com', fullName:'Phan Văn Sang',   gender:'MALE',   dob:'2008-05-17', admDate:'2024-09-01', classCode:'11A2', perf:1 },
  { code:'S412', email:'s412@school.com', fullName:'Cao Thị Thọ',     gender:'FEMALE', dob:'2008-12-31', admDate:'2024-09-01', classCode:'11A2', perf:3 },

  // ── 12A1 ───────────────────────────────────────────────────────────────────
  { code:'S501', email:'s501@school.com', fullName:'Trần Văn Tuấn',   gender:'MALE',   dob:'2007-03-10', admDate:'2023-09-01', classCode:'12A1', perf:4 },
  { code:'S502', email:'s502@school.com', fullName:'Lê Thị Uyên',     gender:'FEMALE', dob:'2007-08-22', admDate:'2023-09-01', classCode:'12A1', perf:5 },
  { code:'S503', email:'s503@school.com', fullName:'Nguyễn Văn Vĩnh', gender:'MALE',   dob:'2007-05-14', admDate:'2023-09-01', classCode:'12A1', perf:3 },
  { code:'S504', email:'s504@school.com', fullName:'Phạm Thị Xuân',   gender:'FEMALE', dob:'2007-11-07', admDate:'2023-09-01', classCode:'12A1', perf:4 },
  { code:'S505', email:'s505@school.com', fullName:'Đặng Văn Yên',    gender:'MALE',   dob:'2007-02-28', admDate:'2023-09-01', classCode:'12A1', perf:2 },
  { code:'S506', email:'s506@school.com', fullName:'Hồ Thị Ánh',      gender:'FEMALE', dob:'2007-07-16', admDate:'2023-09-01', classCode:'12A1', perf:3 },
  { code:'S507', email:'s507@school.com', fullName:'Vũ Văn Bình',     gender:'MALE',   dob:'2007-04-03', admDate:'2023-09-01', classCode:'12A1', perf:4 },
  { code:'S508', email:'s508@school.com', fullName:'Bùi Thị Châu',    gender:'FEMALE', dob:'2007-09-19', admDate:'2023-09-01', classCode:'12A1', perf:5 },

  // ── Chờ phân lớp (pending) ─────────────────────────────────────────────────
  { code:'S006', username:'student06', email:'student06@school.com', fullName:'Đỗ Ngọc Lan',       gender:'FEMALE', dob:'2009-03-18', admDate:'2025-09-01', classCode:undefined, perf:3 },
  { code:'S601', email:'s601@school.com', fullName:'Nguyễn Thị Tuyết',gender:'FEMALE', dob:'2009-07-12', admDate:'2025-09-01', classCode:undefined, perf:4 },
  { code:'S602', email:'s602@school.com', fullName:'Trần Văn Hải',    gender:'MALE',   dob:'2009-03-25', admDate:'2025-09-01', classCode:undefined, perf:2 },
];

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding demo data (idempotent)…');

  const [pwAdmin, pwStaff, pwManager, pwTeacher, pwStudent] = await Promise.all([
    hashPw(seedAdminPassword), hashPw(seedAcademicStaffPassword),
    hashPw(seedManagerPassword), hashPw(seedTeacherPassword), hashPw(seedStudentPassword),
  ]);

  // ── 1. Roles ───────────────────────────────────────────────
  const roleNames = ['ADMIN','ACADEMIC_STAFF','MANAGER','TEACHER','STUDENT'] as const;
  const roles = await Promise.all(
    roleNames.map(name => prisma.role.upsert({ where:{name}, update:{}, create:{name} }))
  );
  const role = Object.fromEntries(roles.map(r => [r.name, r])) as Record<typeof roleNames[number], typeof roles[0]>;

  // ── 2. School year ─────────────────────────────────────────
  const sy = await prisma.schoolYear.upsert({
    where: { name: '2025-2026' },
    update: { startYear:2025, endYear:2026, startDate:toDate('2025-09-01'), endDate:toDate('2026-05-30'), isActive:true },
    create: { name:'2025-2026', startYear:2025, endYear:2026, startDate:toDate('2025-09-01'), endDate:toDate('2026-05-30'), isActive:true },
  });

  // ── 3. System parameters ───────────────────────────────────
  await prisma.systemParameter.upsert({
    where: { schoolYearId: sy.id },
    update: { minAge:15, maxAge:20, maxClassSize:40, minScore:0, maxScore:10, subjectPassScore:5, semesterPassScore:5, effectiveFrom:sy.startDate, effectiveTo:null },
    create: { schoolYearId:sy.id, minAge:15, maxAge:20, maxClassSize:40, minScore:0, maxScore:10, subjectPassScore:5, semesterPassScore:5, effectiveFrom:sy.startDate, effectiveTo:null },
  });

  // ── 4. Semesters (HK1 = completed, HK2 = active) ──────────
  const hk1 = await prisma.semester.upsert({
    where: { schoolYearId_name: { schoolYearId:sy.id, name:'HK1' } },
    update: { startDate:toDate('2025-09-01'), endDate:toDate('2026-01-15'), isActive:false },
    create: { schoolYearId:sy.id, name:'HK1', startDate:toDate('2025-09-01'), endDate:toDate('2026-01-15'), isActive:false },
  });
  const hk2 = await prisma.semester.upsert({
    where: { schoolYearId_name: { schoolYearId:sy.id, name:'HK2' } },
    update: { startDate:toDate('2026-01-16'), endDate:toDate('2026-05-30'), isActive:true },
    create: { schoolYearId:sy.id, name:'HK2', startDate:toDate('2026-01-16'), endDate:toDate('2026-05-30'), isActive:true },
  });

  // ── 5. Grade levels ────────────────────────────────────────
  const [g10, g11, g12] = await Promise.all([
    prisma.gradeLevel.upsert({ where:{level:10}, update:{name:'10', isActive:true}, create:{name:'10', level:10, isActive:true} }),
    prisma.gradeLevel.upsert({ where:{level:11}, update:{name:'11', isActive:true}, create:{name:'11', level:11, isActive:true} }),
    prisma.gradeLevel.upsert({ where:{level:12}, update:{name:'12', isActive:true}, create:{name:'12', level:12, isActive:true} }),
  ]);
  const gradeLevelByLevel: Record<number,typeof g10> = { 10:g10, 11:g11, 12:g12 };

  // ── 6. Subjects ────────────────────────────────────────────
  const subjectList = await Promise.all(
    SUBJECT_DEFS.map(s => prisma.subject.upsert({
      where: { subjectCode: s.code },
      update: { name:s.name, coefficient:s.coefficient, isActive:true },
      create: { subjectCode:s.code, name:s.name, coefficient:s.coefficient, isActive:true },
    }))
  );
  const subj = Object.fromEntries(subjectList.map(s => [s.subjectCode, s]));

  // ── 7. Test types + score weights ──────────────────────────
  const testTypeDefs = [
    { code:'ORAL_15M', name:'Miệng / 15 phút', defaultWeight:1, isMultiple:true  },
    { code:'ONE_PERIOD',name:'Một tiết',        defaultWeight:2, isMultiple:true  },
    { code:'MIDTERM',  name:'Giữa kỳ',          defaultWeight:3, isMultiple:false },
    { code:'FINAL',    name:'Cuối kỳ',           defaultWeight:3, isMultiple:false },
  ];
  const ttList = await Promise.all(
    testTypeDefs.map(t => prisma.testType.upsert({
      where: { code:t.code }, update:t, create:t,
    }))
  );
  const tt = Object.fromEntries(ttList.map(t => [t.code, t]));

  for (const testType of ttList) {
    const existing = await prisma.scoreWeight.findFirst({ where:{ schoolYearId:sy.id, testTypeId:testType.id }, orderBy:{ effectiveFrom:'desc' } });
    const data = { schoolYearId:sy.id, testTypeId:testType.id, weight:testType.defaultWeight, effectiveFrom:sy.startDate, effectiveTo:null as null };
    if (existing) await prisma.scoreWeight.update({ where:{id:existing.id}, data });
    else await prisma.scoreWeight.create({ data });
  }

  // ── 8. Teachers ────────────────────────────────────────────
  const teacherMap = new Map<string, { id:number }>();
  for (const td of TEACHER_DEFS) {
    const t = await prisma.teacher.upsert({
      where: { teacherCode: td.code },
      update: { fullName:td.fullName, email:td.email, phone:td.phone, subjectId:subj[td.subjectCode].id, status:'ACTIVE' },
      create: { teacherCode:td.code, fullName:td.fullName, email:td.email, phone:td.phone, subjectId:subj[td.subjectCode].id, status:'ACTIVE' },
    });
    teacherMap.set(td.code, t);
  }

  // ── 9. Staff users ─────────────────────────────────────────
  await prisma.user.upsert({
    where: { username:'admin' },
    update: { email:'admin@school.com', passwordHash:pwAdmin, fullName:'Quản trị viên', roleId:role.ADMIN.id, status:'ACTIVE', studentId:null, teacherId:null },
    create: { username:'admin', email:'admin@school.com', passwordHash:pwAdmin, fullName:'Quản trị viên', roleId:role.ADMIN.id, status:'ACTIVE' },
  });
  const staffUser = await prisma.user.upsert({
    where: { username:'giaovu01' },
    update: { email:'giaovu01@school.com', passwordHash:pwStaff, fullName:'Giáo vụ Hoài', roleId:role.ACADEMIC_STAFF.id, status:'ACTIVE', studentId:null, teacherId:null },
    create: { username:'giaovu01', email:'giaovu01@school.com', passwordHash:pwStaff, fullName:'Giáo vụ Hoài', roleId:role.ACADEMIC_STAFF.id, status:'ACTIVE' },
  });
  await prisma.user.upsert({
    where: { username:'manager01' },
    update: { email:'manager01@school.com', passwordHash:pwManager, fullName:'Phó Hiệu trưởng', roleId:role.MANAGER.id, status:'ACTIVE', studentId:null, teacherId:null },
    create: { username:'manager01', email:'manager01@school.com', passwordHash:pwManager, fullName:'Phó Hiệu trưởng', roleId:role.MANAGER.id, status:'ACTIVE' },
  });

  // Teacher user accounts
  const teacherUserMap = new Map<string, { id:number }>();
  for (const td of TEACHER_DEFS) {
    const tRecord = teacherMap.get(td.code)!;
    const u = await prisma.user.upsert({
      where: { username: td.username },
      update: { email:td.email, passwordHash:pwTeacher, fullName:td.fullName, roleId:role.TEACHER.id, teacherId:tRecord.id, studentId:null, status:'ACTIVE' },
      create: { username:td.username, email:td.email, passwordHash:pwTeacher, fullName:td.fullName, roleId:role.TEACHER.id, teacherId:tRecord.id, status:'ACTIVE' },
    });
    teacherUserMap.set(td.code, u);
  }

  // ── 10. Classes ────────────────────────────────────────────
  const classDefs = [
    { code:'10A1', gradeLevel:10, homeroomTeacherCode:'T001' as string|null },
    { code:'10A2', gradeLevel:10, homeroomTeacherCode:'T002' },
    { code:'11A1', gradeLevel:11, homeroomTeacherCode:'T003' },
    { code:'11A2', gradeLevel:11, homeroomTeacherCode:null   }, // no GVCN – demo: giáo vụ phân công
    { code:'12A1', gradeLevel:12, homeroomTeacherCode:'T004' },
  ];
  const classMap = new Map<string, { id:number; classCode:string; gradeLevelId:number }>();
  for (const cd of classDefs) {
    const homeroomId = cd.homeroomTeacherCode ? teacherMap.get(cd.homeroomTeacherCode)!.id : null;
    const c = await prisma.class.upsert({
      where: { classCode: cd.code },
      update: { name:cd.code, maxSize:40, status:'ACTIVE', gradeLevelId:gradeLevelByLevel[cd.gradeLevel].id, schoolYearId:sy.id, homeroomTeacherId:homeroomId },
      create: { classCode:cd.code, name:cd.code, maxSize:40, currentSize:0, status:'ACTIVE', gradeLevelId:gradeLevelByLevel[cd.gradeLevel].id, schoolYearId:sy.id, homeroomTeacherId:homeroomId },
    });
    classMap.set(cd.code, c);
  }

  // ── 11. Students + user accounts + enrollments ─────────────
  const studentMap = new Map<string, { id:number; studentCode:string; perf:number }>();

  const upsertEnrollment = async (studentId:number, classId:number, semId:number) => {
    const active = await prisma.studentClassEnrollment.findMany({ where:{ studentId, semesterId:semId, status:'ACTIVE' } });
    if (active.length > 0) {
      const [first, ...rest] = active;
      await prisma.studentClassEnrollment.update({ where:{id:first.id}, data:{ classId, status:'ACTIVE', endedAt:null, reason:null } });
      for (const e of rest) await prisma.studentClassEnrollment.update({ where:{id:e.id}, data:{ status:'INACTIVE', endedAt:new Date(), reason:'Seed cleanup' } });
    } else {
      await prisma.studentClassEnrollment.create({ data:{ studentId, classId, semesterId:semId, status:'ACTIVE' } });
    }
  };

  for (const sd of STUDENTS) {
    const s = await prisma.student.upsert({
      where: { studentCode: sd.code },
      update: { fullName:sd.fullName, gender:sd.gender, dateOfBirth:toDate(sd.dob), admissionDate:toDate(sd.admDate), address:'TP.HCM', email:sd.email, status:sd.classCode ? 'ACTIVE' : 'PENDING_CLASS_ASSIGNMENT' },
      create: { studentCode:sd.code, fullName:sd.fullName, gender:sd.gender, dateOfBirth:toDate(sd.dob), admissionDate:toDate(sd.admDate), address:'TP.HCM', email:sd.email, status:sd.classCode ? 'ACTIVE' : 'PENDING_CLASS_ASSIGNMENT', note:'Demo' },
    });
    studentMap.set(sd.code, { ...s, perf: sd.perf });

    if (sd.username) {
      await prisma.user.upsert({
        where: { username: sd.username },
        update: { email:sd.email, passwordHash:pwStudent, fullName:sd.fullName, roleId:role.STUDENT.id, studentId:s.id, teacherId:null, status:'ACTIVE' },
        create: { username:sd.username, email:sd.email, passwordHash:pwStudent, fullName:sd.fullName, roleId:role.STUDENT.id, studentId:s.id, status:'ACTIVE' },
      });
    }

    if (sd.classCode) {
      const cls = classMap.get(sd.classCode);
      if (!cls) throw new Error(`Missing class ${sd.classCode}`);
      await upsertEnrollment(s.id, cls.id, hk1.id);
      await upsertEnrollment(s.id, cls.id, hk2.id);
    }
  }

  // Update currentSize for all classes
  for (const [, cls] of classMap) {
    const cnt = await prisma.studentClassEnrollment.count({ where:{ classId:cls.id, semesterId:hk2.id, status:'ACTIVE' } });
    await prisma.class.update({ where:{id:cls.id}, data:{ currentSize:cnt } });
  }

  // ── 12. Teacher assignments ────────────────────────────────
  const upsertAssign = async (data: { teacherId:number; classId:number; subjectId:number|null; schoolYearId:number; semesterId:number|null; assignmentType:TeacherAssignmentType }) => {
    const existing = await prisma.teacherAssignment.findFirst({ where:{ ...data, isActive:true } });
    if (existing) return prisma.teacherAssignment.update({ where:{id:existing.id}, data:{ ...data, isActive:true, createdBy:staffUser.id } });
    return prisma.teacherAssignment.create({ data:{ ...data, isActive:true, createdBy:staffUser.id } });
  };

  const T = (code: string) => teacherMap.get(code)!.id;
  const C = (code: string) => classMap.get(code)!.id;
  const S = (code: string) => subj[code].id;

  // HOMEROOM assignments (per school year, no semester)
  for (const td of TEACHER_DEFS) {
    if (!td.homeroomClass) continue;
    await upsertAssign({ teacherId:T(td.code), classId:C(td.homeroomClass), subjectId:null, schoolYearId:sy.id, semesterId:null, assignmentType:TeacherAssignmentType.HOMEROOM });
  }

  // SUBJECT assignments HK1
  const hk1Assigns = [
    [T('T001'), C('10A1'), S('MATH')], [T('T001'), C('10A2'), S('MATH')],
    [T('T002'), C('10A1'), S('LIT')],  [T('T002'), C('10A2'), S('LIT')],
    [T('T003'), C('10A1'), S('ENG')],  [T('T003'), C('11A1'), S('ENG')],
    [T('T004'), C('10A1'), S('PHY')],  [T('T004'), C('11A1'), S('PHY')], [T('T004'), C('12A1'), S('PHY')],
    [T('T005'), C('10A1'), S('CHEM')], [T('T005'), C('10A2'), S('CHEM')],
  ] as [number,number,number][];
  for (const [tid, cid, sid] of hk1Assigns) {
    await upsertAssign({ teacherId:tid, classId:cid, subjectId:sid, schoolYearId:sy.id, semesterId:hk1.id, assignmentType:TeacherAssignmentType.SUBJECT });
  }

  // SUBJECT assignments HK2
  const hk2Assigns = [
    [T('T001'), C('10A1'), S('MATH')], [T('T001'), C('10A2'), S('MATH')],
    [T('T002'), C('10A1'), S('LIT')],  [T('T002'), C('10A2'), S('LIT')],
    [T('T003'), C('11A1'), S('ENG')],
    [T('T004'), C('10A1'), S('PHY')],  [T('T004'), C('12A1'), S('PHY')],
    [T('T005'), C('10A1'), S('CHEM')],
  ] as [number,number,number][];
  for (const [tid, cid, sid] of hk2Assigns) {
    await upsertAssign({ teacherId:tid, classId:cid, subjectId:sid, schoolYearId:sy.id, semesterId:hk2.id, assignmentType:TeacherAssignmentType.SUBJECT });
  }

  // ── 13. Score sheets + scores ──────────────────────────────
  /**
   * Creates/updates a score sheet and its score details for a given set of students.
   * finalStatus / submitAt / lockAt control the lifecycle state.
   */
  const buildSheet = async (
    classCode: string, subjectCode: string, semId: number, subjectIdx: number,
    studentCodes: string[],
    finalStatus: ScoreSheetStatus,
    submitAt?: Date, lockAt?: Date,
  ) => {
    const classId   = C(classCode);
    const subjectId = S(subjectCode);

    const sheet = await prisma.scoreSheet.upsert({
      where: { classId_subjectId_semesterId: { classId, subjectId, semesterId:semId } },
      update: { status: ScoreSheetStatus.DRAFT },
      create: { classId, subjectId, semesterId:semId, status:ScoreSheetStatus.DRAFT, createdBy:staffUser.id },
    });

    for (let sIdx = 0; sIdx < studentCodes.length; sIdx++) {
      const sRec = studentMap.get(studentCodes[sIdx]);
      if (!sRec) continue;
      const perf = sRec.perf as 1|2|3|4|5;

      const oral      = genScore(perf, sIdx,   subjectIdx, 'ORAL_15M');
      const onePeriod = genScore(perf, sIdx+1,  subjectIdx, 'ONE_PERIOD');
      const midterm   = genScore(perf, sIdx+2,  subjectIdx, 'MIDTERM');
      const final     = genScore(perf, sIdx+3,  subjectIdx, 'FINAL');
      const avg       = calcAvg(oral, onePeriod, midterm, final);

      const ss = await prisma.studentSubjectScore.upsert({
        where: { scoreSheetId_studentId: { scoreSheetId:sheet.id, studentId:sRec.id } },
        update: { averageScore:avg, passStatus:avg >= 5, calculatedAt:new Date() },
        create: { scoreSheetId:sheet.id, studentId:sRec.id, averageScore:avg, passStatus:avg >= 5, calculatedAt:new Date() },
      });

      for (const [code, score, w] of [
        ['ORAL_15M', oral,      tt.ORAL_15M.defaultWeight ],
        ['ONE_PERIOD', onePeriod, tt.ONE_PERIOD.defaultWeight],
        ['MIDTERM',  midterm,   tt.MIDTERM.defaultWeight  ],
        ['FINAL',    final,     tt.FINAL.defaultWeight    ],
      ] as [string, number, number][]) {
        const testType = tt[code as keyof typeof tt];
        await prisma.scoreDetail.upsert({
          where: { studentSubjectScoreId_testTypeId_attemptNo: { studentSubjectScoreId:ss.id, testTypeId:testType.id, attemptNo:1 } },
          update: { score, weightSnapshot:w },
          create: { studentSubjectScoreId:ss.id, testTypeId:testType.id, attemptNo:1, score, weightSnapshot:w },
        });
      }
    }

    // Apply final lifecycle state
    if (finalStatus !== ScoreSheetStatus.DRAFT) {
      await prisma.scoreSheet.update({
        where: { id:sheet.id },
        data: { status:finalStatus, submittedAt:submitAt ?? null, lockedAt:lockAt ?? null },
      });
    }

    return sheet;
  };

  const t = (daysAgo: number) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d; };

  // Students enrolled in each class for HK1
  const in10A1 = STUDENTS.filter(s => s.classCode === '10A1').map(s => s.code);
  const in10A2 = STUDENTS.filter(s => s.classCode === '10A2').map(s => s.code);
  const in11A1 = STUDENTS.filter(s => s.classCode === '11A1').map(s => s.code);
  const in12A1 = STUDENTS.filter(s => s.classCode === '12A1').map(s => s.code);

  // ── 10A1 HK1 (5 môn, đa dạng trạng thái) ─────────────────
  await buildSheet('10A1','MATH', hk1.id, 0, in10A1, ScoreSheetStatus.LOCKED,    t(60), t(55));
  await buildSheet('10A1','LIT',  hk1.id, 1, in10A1, ScoreSheetStatus.LOCKED,    t(60), t(55));
  await buildSheet('10A1','ENG',  hk1.id, 2, in10A1, ScoreSheetStatus.LOCKED,    t(58), t(53));
  const phySheet10A1HK1 = await buildSheet('10A1','PHY', hk1.id, 3, in10A1, ScoreSheetStatus.SUBMITTED, t(20)); // giáo vụ chưa khóa
  await buildSheet('10A1','CHEM', hk1.id, 4, in10A1.slice(0,12), ScoreSheetStatus.DRAFT); // teacher mới nhập 12/20

  // ── 10A2 HK1 ──────────────────────────────────────────────
  await buildSheet('10A2','MATH', hk1.id, 0, in10A2, ScoreSheetStatus.LOCKED, t(58), t(52));
  await buildSheet('10A2','LIT',  hk1.id, 1, in10A2, ScoreSheetStatus.LOCKED, t(58), t(52));

  // ── 11A1 HK1 ──────────────────────────────────────────────
  await buildSheet('11A1','ENG', hk1.id, 2, in11A1, ScoreSheetStatus.LOCKED,    t(57), t(51));
  await buildSheet('11A1','PHY', hk1.id, 3, in11A1, ScoreSheetStatus.SUBMITTED, t(18)); // giáo vụ chưa khóa

  // ── 12A1 HK1 ──────────────────────────────────────────────
  await buildSheet('12A1','PHY', hk1.id, 3, in12A1, ScoreSheetStatus.LOCKED, t(56), t(50));

  // ── 10A1 HK2 (đang nhập – DRAFT) ─────────────────────────
  await buildSheet('10A1','MATH', hk2.id, 0, in10A1.slice(0,10), ScoreSheetStatus.DRAFT);
  await buildSheet('10A1','LIT',  hk2.id, 1, in10A1.slice(0, 8), ScoreSheetStatus.DRAFT);

  // ── 14. Score change requests ──────────────────────────────
  // Request 1 – PENDING: teacher01 muốn sửa điểm Toán/10A1/HK1 cho S003 (MIDTERM)
  const mathSheet10A1HK1 = await prisma.scoreSheet.findUnique({
    where: { classId_subjectId_semesterId: { classId:C('10A1'), subjectId:S('MATH'), semesterId:hk1.id } },
  });
  const s003 = studentMap.get('S003');
  if (mathSheet10A1HK1 && s003) {
    const ss003 = await prisma.studentSubjectScore.findUnique({
      where: { scoreSheetId_studentId: { scoreSheetId:mathSheet10A1HK1.id, studentId:s003.id } },
      include: { scoreDetails: { include: { testType: true } } },
    });
    const midtermDetail = ss003?.scoreDetails.find(d => d.testType.code === 'MIDTERM');
    if (ss003 && midtermDetail) {
      const pendingExists = await prisma.scoreChangeRequest.findFirst({
        where: { scoreSheetId:mathSheet10A1HK1.id, studentSubjectScoreId:ss003.id, status:'PENDING' },
      });
      if (!pendingExists) {
        await prisma.scoreChangeRequest.create({
          data: {
            scoreSheetId: mathSheet10A1HK1.id,
            studentSubjectScoreId: ss003.id,
            scoreDetailId: midtermDetail.id,
            testTypeId: tt.MIDTERM.id,
            attemptNo: 1,
            oldScore: midtermDetail.score,
            newScore: Math.min(10, midtermDetail.score + 0.5),
            reason: 'Học sinh phúc khảo và cung cấp bài thi gốc. Điểm thực tế cao hơn do nhập nhầm cột điểm.',
            status: 'PENDING',
            requestedById: teacherUserMap.get('T001')!.id,
          },
        });
      }
    }
  }

  // Request 2 – APPROVED: teacher02 đã sửa điểm Văn/10A1/HK1 cho S001 (ORAL_15M) – đã được duyệt
  const litSheet10A1HK1 = await prisma.scoreSheet.findUnique({
    where: { classId_subjectId_semesterId: { classId:C('10A1'), subjectId:S('LIT'), semesterId:hk1.id } },
  });
  const s001 = studentMap.get('S001');
  if (litSheet10A1HK1 && s001) {
    const ss001 = await prisma.studentSubjectScore.findUnique({
      where: { scoreSheetId_studentId: { scoreSheetId:litSheet10A1HK1.id, studentId:s001.id } },
      include: { scoreDetails: { include: { testType: true } } },
    });
    const oralDetail = ss001?.scoreDetails.find(d => d.testType.code === 'ORAL_15M');
    if (ss001 && oralDetail) {
      const approvedExists = await prisma.scoreChangeRequest.findFirst({
        where: { scoreSheetId:litSheet10A1HK1.id, studentSubjectScoreId:ss001.id, status:'APPROVED' },
      });
      if (!approvedExists) {
        await prisma.scoreChangeRequest.create({
          data: {
            scoreSheetId: litSheet10A1HK1.id,
            studentSubjectScoreId: ss001.id,
            scoreDetailId: oralDetail.id,
            testTypeId: tt.ORAL_15M.id,
            attemptNo: 1,
            oldScore: oralDetail.score,
            newScore: Math.min(10, oralDetail.score + 0.5),
            reason: 'Nhập sai điểm miệng do lỗi đánh máy.',
            status: 'APPROVED',
            requestedById: teacherUserMap.get('T002')!.id,
            reviewedById: staffUser.id,
            reviewedAt: t(45),
            reviewNote: 'Đã kiểm tra bảng điểm gốc. Duyệt chỉnh sửa.',
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  console.log('\n✔ Seed hoàn tất.');
  console.log('──────────────────────────────────────────────────────');
  console.log('Tài khoản demo:');
  console.log(`  Admin:        admin        / ${seedAdminPassword}`);
  console.log(`  Giáo vụ:      giaovu01     / ${seedAcademicStaffPassword}`);
  console.log(`  Ban giám hiệu:manager01    / ${seedManagerPassword}`);
  console.log(`  GVCN 10A1:    teacher01    / ${seedTeacherPassword}  (Nguyễn Tuấn An – Toán)`);
  console.log(`  GVCN 10A2:    teacher02    / ${seedTeacherPassword}  (Trần Thị Bích Ngọc – Văn)`);
  console.log(`  GVCN 11A1:    teacher03    / ${seedTeacherPassword}  (Lê Văn Cường – Anh)`);
  console.log(`  GVCN 12A1:    teacher04    / ${seedTeacherPassword}  (Phạm Thị Duyên – Vật lý)`);
  console.log(`  GV Hóa:       teacher05    / ${seedTeacherPassword}  (Hoàng Minh Đức – không CN)`);
  console.log(`  Học sinh:     student01-07 / ${seedStudentPassword}`);
  console.log('──────────────────────────────────────────────────────');
  console.log('Dữ liệu tổng quan:');
  console.log('  Lớp: 10A1(20hs) 10A2(15hs) 11A1(15hs) 11A2(12hs) 12A1(8hs) + 3 chờ phân lớp');
  console.log('  Bảng điểm HK1: Toán/Văn/Anh/VL/Hóa – 10A1 đầy đủ; 10A2 Toán+Văn; 11A1 Anh+VL; 12A1 VL');
  console.log('    LOCKED : Toán/Văn/Anh/10A1-HK1, Toán/Văn/10A2-HK1, Anh/11A1-HK1, VL/12A1-HK1');
  console.log('    SUBMITTED: VL/10A1-HK1, VL/11A1-HK1 (giáo vụ demo khóa)');
  console.log('    DRAFT:   Hóa/10A1-HK1 (nhập 12/20 hs), Toán+Văn/10A1-HK2');
  console.log('  Yêu cầu sửa điểm: 1 PENDING (Toán/HK1/S003), 1 APPROVED (Văn/HK1/S001)');
  console.log('  Học kỳ: HK1 kết thúc, HK2 đang tiến hành');
  console.log('──────────────────────────────────────────────────────');
  void phySheet10A1HK1; // suppress unused warning
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
