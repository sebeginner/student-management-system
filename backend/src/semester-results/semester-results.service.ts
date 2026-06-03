import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types';
import { AuditLogService } from '../common/audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

/** Thông tư 58/2011 – phân loại học lực */
function classifyAcademic(
  subjectAverages: number[],
  semesterAvg: number,
): string {
  if (subjectAverages.length === 0) return 'POOR';

  const min = Math.min(...subjectAverages);

  if (semesterAvg >= 8.0 && min >= 6.5) return 'EXCELLENT';
  if (semesterAvg >= 6.5 && min >= 5.0) return 'GOOD';
  if (semesterAvg >= 5.0 && min >= 3.5) return 'AVERAGE';
  if (semesterAvg >= 3.5 && min >= 2.0) return 'WEAK';
  return 'POOR';
}

/** Tổng kết năm: điểm TB năm = (HK1 × 1 + HK2 × 2) / 3 */
function calcYearAvg(hk1: number, hk2: number) {
  return Math.round(((hk1 * 1 + hk2 * 2) / 3) * 100) / 100;
}

/** Xét lên lớp theo Thông tư 58 */
function makeDecision(
  academicRating: string,
  conductRating: string | null,
): string {
  const conduct = conductRating ?? 'AVERAGE';

  if (academicRating === 'POOR') return 'RETAIN';
  if (academicRating === 'WEAK' && conduct === 'WEAK') return 'RETAIN';
  if (academicRating === 'WEAK' && (conduct === 'GOOD' || conduct === 'EXCELLENT')) return 'REMEDIAL';
  if ((academicRating === 'AVERAGE' || academicRating === 'GOOD' || academicRating === 'EXCELLENT') && conduct === 'WEAK') return 'CONDUCT_REVIEW';
  return 'ADVANCE';
}

@Injectable()
export class SemesterResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Chốt kết quả học kỳ cho tất cả học sinh trong tất cả lớp của semester này. */
  async finalizeSemester(semesterId: number, user: AuthenticatedUser) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      include: { schoolYear: true },
    });
    if (!semester) throw new NotFoundException('Không tìm thấy học kỳ');

    // Kiểm tra tất cả scoreSheets trong semester đã LOCKED
    const unlockedSheets = await this.prisma.scoreSheet.findMany({
      where: { semesterId, status: { not: 'LOCKED' } },
      select: { id: true, class: { select: { name: true } }, subject: { select: { name: true } } },
    });
    if (unlockedSheets.length > 0) {
      const names = unlockedSheets.slice(0, 5).map(s => `${s.class.name}/${s.subject.name}`).join(', ');
      throw new BadRequestException({
        errorKey: 'SHEETS_NOT_LOCKED',
        message: `Còn ${unlockedSheets.length} bảng điểm chưa khóa: ${names}${unlockedSheets.length > 5 ? '...' : ''}`,
      });
    }

    // Lấy tất cả enrollment active của semester này
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { semesterId, status: 'ACTIVE' },
      select: { id: true, studentId: true, classId: true },
    });

    const now = new Date();
    let finalized = 0;

    for (const enrollment of enrollments) {
      // Lấy tất cả điểm TB các môn của học sinh trong semester
      const scores = await this.prisma.studentSubjectScore.findMany({
        where: {
          studentId: enrollment.studentId,
          scoreSheet: { semesterId, classId: enrollment.classId },
          averageScore: { not: null },
        },
        select: { averageScore: true },
      });

      const averages = scores.map(s => s.averageScore!).filter(v => v !== null);
      if (averages.length === 0) continue;

      const semAvg = Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100;
      const failedCount = averages.filter(a => a < 5.0).length;
      const rating = classifyAcademic(averages, semAvg);

      // Upsert SemesterStudentResult
      await this.prisma.semesterStudentResult.upsert({
        where: { studentId_semesterId: { studentId: enrollment.studentId, semesterId } },
        update: { semesterAverage: semAvg, academicRating: rating, subjectCount: averages.length, failedSubjectCount: failedCount, finalizedAt: now, finalizedById: user.id, classId: enrollment.classId },
        create: { studentId: enrollment.studentId, semesterId, classId: enrollment.classId, semesterAverage: semAvg, academicRating: rating, subjectCount: averages.length, failedSubjectCount: failedCount, finalizedAt: now, finalizedById: user.id },
      });

      // Cập nhật StudentClassEnrollment.semesterAverage (field đang trống)
      await this.prisma.studentClassEnrollment.update({
        where: { id: enrollment.id },
        data: { semesterAverage: semAvg },
      });

      finalized++;
    }

    void this.auditLog.log({
      userId: user.id,
      action: 'FINALIZE_SEMESTER',
      entityType: 'SemesterStudentResult',
      newValue: { semesterId, semesterName: semester.name, studentCount: finalized },
    });

    return {
      semesterId,
      semesterName: semester.name,
      schoolYear: semester.schoolYear.name,
      studentCount: finalized,
    };
  }

  async getSemesterResults(semesterId: number, classId?: number) {
    return this.prisma.semesterStudentResult.findMany({
      where: { semesterId, ...(classId ? { classId } : {}) },
      include: {
        student: { select: { id: true, studentCode: true, fullName: true, gender: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { semesterAverage: 'desc' }],
    });
  }

  /** Tổng kết năm học và đưa ra quyết định lên lớp */
  async generateYearEnd(schoolYearId: number, user: AuthenticatedUser) {
    const schoolYear = await this.prisma.schoolYear.findUnique({
      where: { id: schoolYearId },
      include: { semesters: { orderBy: { startDate: 'asc' } } },
    });
    if (!schoolYear) throw new NotFoundException('Không tìm thấy năm học');
    if (schoolYear.semesters.length < 2) {
      throw new BadRequestException({ errorKey: 'INCOMPLETE_SEMESTERS', message: 'Cần đủ 2 học kỳ để tổng kết' });
    }

    const [hk1, hk2] = schoolYear.semesters;

    // Kiểm tra đã chốt cả 2 HK
    const [hk1Results, hk2Results] = await Promise.all([
      this.prisma.semesterStudentResult.findMany({ where: { semesterId: hk1.id }, select: { studentId: true, semesterAverage: true, classId: true } }),
      this.prisma.semesterStudentResult.findMany({ where: { semesterId: hk2.id }, select: { studentId: true, semesterAverage: true, classId: true } }),
    ]);

    if (hk1Results.length === 0 || hk2Results.length === 0) {
      throw new BadRequestException({ errorKey: 'SEMESTERS_NOT_FINALIZED', message: 'Cần chốt kết quả cả HK1 và HK2 trước' });
    }

    const hk1Map = new Map(hk1Results.map(r => [r.studentId, r]));
    const hk2Map = new Map(hk2Results.map(r => [r.studentId, r]));

    const now = new Date();
    let generated = 0;

    for (const [studentId, hk2r] of hk2Map) {
      const hk1r = hk1Map.get(studentId);
      if (!hk1r) continue;

      const yearAvg = calcYearAvg(hk1r.semesterAverage, hk2r.semesterAverage);

      // Phân loại học lực năm dựa trên điểm TB năm
      const allSubjectAverages = await this.prisma.studentSubjectScore.findMany({
        where: {
          studentId,
          scoreSheet: { semesterId: { in: [hk1.id, hk2.id] }, classId: hk2r.classId },
          averageScore: { not: null },
        },
        select: { averageScore: true },
      });
      const avgs = allSubjectAverages.map(s => s.averageScore!);
      const yearRating = classifyAcademic(avgs, yearAvg);

      // Lấy hạnh kiểm nếu có
      const conduct = await this.prisma.conductAssessment.findFirst({
        where: { studentId, semesterId: hk2.id, status: 'FINALIZED' },
        select: { finalRating: true },
      });

      const decision = makeDecision(yearRating, conduct?.finalRating ?? null);

      await this.prisma.yearEndResult.upsert({
        where: { studentId_schoolYearId: { studentId, schoolYearId } },
        update: { hk1Average: hk1r.semesterAverage, hk2Average: hk2r.semesterAverage, yearAverage: yearAvg, academicRating: yearRating, conductRating: conduct?.finalRating ?? null, decision, finalizedById: user.id, classId: hk2r.classId },
        create: { studentId, schoolYearId, classId: hk2r.classId, hk1Average: hk1r.semesterAverage, hk2Average: hk2r.semesterAverage, yearAverage: yearAvg, academicRating: yearRating, conductRating: conduct?.finalRating ?? null, decision, finalizedById: user.id },
      });

      generated++;
    }

    void this.auditLog.log({
      userId: user.id,
      action: 'GENERATE_YEAR_END',
      entityType: 'YearEndResult',
      newValue: { schoolYearId, schoolYear: schoolYear.name, studentCount: generated },
    });

    return { schoolYearId, schoolYear: schoolYear.name, studentCount: generated };
  }

  async getYearEndResults(schoolYearId: number, classId?: number) {
    return this.prisma.yearEndResult.findMany({
      where: { schoolYearId, ...(classId ? { classId } : {}) },
      include: {
        student: { select: { id: true, studentCode: true, fullName: true, gender: true } },
        class: { select: { id: true, name: true } },
        schoolYear: { select: { name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { yearAverage: 'desc' }],
    });
  }
}
