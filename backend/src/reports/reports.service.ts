import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ScoreSheetStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PermissionScopeService } from '../authorization/permission-scope.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClassSemesterReportQueryDto,
  DashboardSummaryReportQueryDto,
  StudentSemesterReportQueryDto,
  SubjectSummaryReportQueryDto,
} from './dto/report-query.dto';

const SCORE_SHEET_REPORT_INCLUDE = {
  class: {
    include: {
      gradeLevel: true,
      schoolYear: true,
    },
  },
  subject: true,
  semester: {
    include: {
      schoolYear: true,
    },
  },
  studentScores: {
    include: {
      student: true,
    },
  },
};

type ScoreSheetForReport = Prisma.ScoreSheetGetPayload<{
  include: typeof SCORE_SHEET_REPORT_INCLUDE;
}>;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionScope: PermissionScopeService,
  ) {}

  async getClassSemesterReport(
    query: ClassSemesterReportQueryDto,
    user: AuthenticatedUser,
  ) {
    if (!query.classId || !query.semesterId) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'classId va semesterId la bat buoc',
      });
    }

    await this.ensureCanViewClassReport(user, query.classId, query.semesterId);

    const [classItem, params, sheets, enrollments] = await Promise.all([
      this.findClass(query.classId),
      this.getSemesterParameters(query.semesterId),
      this.getScoreSheets(
        { classId: query.classId, semesterId: query.semesterId },
        Boolean(query.includeUnOfficial),
      ),
      this.prisma.studentClassEnrollment.findMany({
        where: {
          classId: query.classId,
          semesterId: query.semesterId,
          status: 'ACTIVE',
        },
        include: { student: true },
        orderBy: { studentId: 'asc' },
      }),
    ]);

    this.ensureReportSheetsReady(sheets, Boolean(query.includeUnOfficial));
    const studentSummaries = this.buildStudentSemesterSummaries(
      enrollments.map((item) => item.student),
      sheets,
      params.passSemesterScore,
    );
    const semesterAverages = studentSummaries
      .map((item) => item.semesterAverage)
      .filter((value): value is number => value !== null);
    const classSemesterAverage = this.roundAverage(semesterAverages);

    return {
      class: classItem,
      semesterId: query.semesterId,
      isOfficial: this.isOfficial(sheets),
      studentCount: enrollments.length,
      classSemesterAverage,
      passCount: studentSummaries.filter((item) => item.result === 'PASS')
        .length,
      failCount: studentSummaries.filter((item) => item.result === 'FAIL')
        .length,
      students: studentSummaries,
    };
  }

  async getSubjectSummary(
    query: SubjectSummaryReportQueryDto,
    user: AuthenticatedUser,
  ) {
    if (!query.subjectId || !query.semesterId) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'subjectId va semesterId la bat buoc',
      });
    }

    if (user.role === 'TEACHER' && !query.classId) {
      throw this.forbiddenReportScope();
    }

    if (query.classId) {
      await this.ensureCanViewSubjectReport(
        user,
        query.classId,
        query.subjectId,
        query.semesterId,
      );
    } else {
      this.ensureSchoolWideReportAccess(user);
    }

    const sheets = await this.getScoreSheets(
      {
        classId: query.classId,
        subjectId: query.subjectId,
        semesterId: query.semesterId,
      },
      Boolean(query.includeUnOfficial),
    );
    this.ensureReportSheetsReady(sheets, Boolean(query.includeUnOfficial));

    const summaries = sheets.map((sheet) => {
      const scores = sheet.studentScores
        .map((studentScore) => studentScore.averageScore)
        .filter((score): score is number => score !== null);
      const passCount = sheet.studentScores.filter(
        (studentScore) => studentScore.passStatus === true,
      ).length;
      const studentCount = sheet.studentScores.length;

      return {
        classId: sheet.classId,
        className: sheet.class.name,
        subjectId: sheet.subjectId,
        subjectName: sheet.subject.name,
        semesterId: sheet.semesterId,
        isOfficial: sheet.status === ScoreSheetStatus.LOCKED,
        studentCount,
        subjectAverage: this.roundAverage(scores),
        passCount,
        passRate:
          studentCount === 0
            ? 0
            : Math.round((passCount / studentCount) * 10000) / 100,
      };
    });

    return {
      subjectId: query.subjectId,
      semesterId: query.semesterId,
      isOfficial: summaries.every((summary) => summary.isOfficial),
      details: summaries,
    };
  }

  async getStudentSemesterReport(
    studentId: number,
    query: StudentSemesterReportQueryDto,
    user: AuthenticatedUser,
  ) {
    if (!query.semesterId) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'semesterId la bat buoc',
      });
    }

    await this.permissionScope.canViewStudentScores(user, studentId);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'Khong tim thay hoc sinh',
      });
    }

    const [params, sheets] = await Promise.all([
      this.getSemesterParameters(query.semesterId),
      this.getScoreSheets(
        { semesterId: query.semesterId, studentId },
        Boolean(query.includeUnOfficial),
      ),
    ]);
    this.ensureReportSheetsReady(sheets, Boolean(query.includeUnOfficial));

    const subjectScores = sheets
      .map((sheet) => {
        const score = sheet.studentScores.find(
          (item) => item.studentId === studentId,
        );
        return {
          scoreSheetId: sheet.id,
          classId: sheet.classId,
          className: sheet.class.name,
          subjectId: sheet.subjectId,
          subjectName: sheet.subject.name,
          status: sheet.status,
          averageScore: score?.averageScore ?? null,
          passStatus: score?.passStatus ?? null,
        };
      })
      .filter((item) => item.averageScore !== null);
    const semesterAverage = this.roundAverage(
      subjectScores.map((item) => item.averageScore as number),
    );

    return {
      student,
      semesterId: query.semesterId,
      isOfficial: this.isOfficial(sheets),
      subjectCount: subjectScores.length,
      semesterAverage,
      result:
        semesterAverage !== null && semesterAverage >= params.passSemesterScore
          ? 'PASS'
          : 'FAIL',
      subjectScores,
    };
  }

  async getDashboardSummary(
    query: DashboardSummaryReportQueryDto,
    user: AuthenticatedUser,
  ) {
    this.ensureSchoolWideReportAccess(user);

    const schoolYear = query.schoolYearId
      ? await this.prisma.schoolYear.findUnique({
          where: { id: query.schoolYearId },
        })
      : await this.prisma.schoolYear.findFirst({
          where: { isActive: true },
          orderBy: { startYear: 'desc' },
        });
    const semester = query.semesterId
      ? await this.prisma.semester.findUnique({
          where: { id: query.semesterId },
        })
      : await this.prisma.semester.findFirst({
          where: { schoolYearId: schoolYear?.id, isActive: true },
          orderBy: { startDate: 'desc' },
        });

    if (!schoolYear || !semester) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'Chua co nam hoc hoac hoc ky de lap dashboard',
      });
    }

    const [students, classes, subjects, sheets, pendingScoreChanges] =
      await Promise.all([
        this.prisma.student.count({ where: { status: { not: 'INACTIVE' } } }),
        this.prisma.class.count({ where: { schoolYearId: schoolYear.id } }),
        this.prisma.subject.count({ where: { isActive: true } }),
        this.getScoreSheets(
          { semesterId: semester.id },
          Boolean(query.includeUnOfficial),
        ),
        this.prisma.scoreChangeRequest.count({ where: { status: 'PENDING' } }),
      ]);

    const lockedCount = sheets.filter(
      (sheet) => sheet.status === ScoreSheetStatus.LOCKED,
    ).length;
    return {
      schoolYear,
      semester,
      isOfficial: sheets.length > 0 && lockedCount === sheets.length,
      studentCount: students,
      classCount: classes,
      subjectCount: subjects,
      scoreSheetCount: sheets.length,
      lockedScoreSheetCount: lockedCount,
      pendingScoreChangeRequestCount: pendingScoreChanges,
    };
  }

  private async ensureCanViewClassReport(
    user: AuthenticatedUser,
    classId: number,
    semesterId: number,
  ) {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return true;
    }

    if (user.role === 'TEACHER' && user.teacherId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: semesterId },
      });
      if (
        semester &&
        (await this.permissionScope.isHomeroomTeacherOfClass(
          user.teacherId,
          classId,
          semester.schoolYearId,
        ))
      ) {
        return true;
      }
    }

    throw this.forbiddenReportScope();
  }

  private async ensureCanViewSubjectReport(
    user: AuthenticatedUser,
    classId: number,
    subjectId: number,
    semesterId: number,
  ) {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return true;
    }

    if (user.role === 'TEACHER' && user.teacherId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: semesterId },
      });
      const isHomeroom = semester
        ? await this.permissionScope.isHomeroomTeacherOfClass(
            user.teacherId,
            classId,
            semester.schoolYearId,
          )
        : false;
      const isSubjectTeacher =
        await this.permissionScope.isSubjectTeacherOfClass(
          user.teacherId,
          classId,
          subjectId,
          semesterId,
        );
      if (isHomeroom || isSubjectTeacher) {
        return true;
      }
    }

    throw this.forbiddenReportScope();
  }

  private ensureSchoolWideReportAccess(user: AuthenticatedUser) {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return true;
    }
    throw this.forbiddenReportScope();
  }

  private async getScoreSheets(
    filter: {
      classId?: number;
      subjectId?: number;
      semesterId: number;
      studentId?: number;
    },
    includeUnOfficial: boolean,
  ) {
    return this.prisma.scoreSheet.findMany({
      where: {
        classId: filter.classId,
        subjectId: filter.subjectId,
        semesterId: filter.semesterId,
        status: includeUnOfficial ? undefined : ScoreSheetStatus.LOCKED,
        studentScores: filter.studentId
          ? { some: { studentId: filter.studentId } }
          : undefined,
      },
      include: SCORE_SHEET_REPORT_INCLUDE,
      orderBy: [{ classId: 'asc' }, { subjectId: 'asc' }],
    });
  }

  private ensureReportSheetsReady(
    sheets: ScoreSheetForReport[],
    includeUnOfficial: boolean,
  ) {
    if (sheets.length === 0) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: includeUnOfficial
          ? 'Chua co du lieu bang diem de lap bao cao'
          : 'Chua co bang diem LOCKED de lap bao cao chinh thuc',
      });
    }

    if (
      !includeUnOfficial &&
      sheets.some((sheet) => sheet.status !== ScoreSheetStatus.LOCKED)
    ) {
      throw new BadRequestException({
        errorKey: 'SCORE_SHEET_NOT_LOCKED',
        message: 'Bao cao chinh thuc chi dung bang diem LOCKED',
      });
    }
  }

  private buildStudentSemesterSummaries(
    students: Array<{ id: number; studentCode: string; fullName: string }>,
    sheets: ScoreSheetForReport[],
    passSemesterScore: number,
  ) {
    return students.map((student) => {
      const subjectScores = sheets
        .map((sheet) => {
          const score = sheet.studentScores.find(
            (item) => item.studentId === student.id,
          );
          return score?.averageScore ?? null;
        })
        .filter((score): score is number => score !== null);
      const semesterAverage = this.roundAverage(subjectScores);

      return {
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        subjectCount: subjectScores.length,
        semesterAverage,
        result:
          semesterAverage !== null && semesterAverage >= passSemesterScore
            ? 'PASS'
            : 'FAIL',
      };
    });
  }

  private async getSemesterParameters(semesterId: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'Hoc ky khong hop le',
      });
    }

    const params = await this.prisma.systemParameter.findFirst({
      where: { schoolYearId: semester.schoolYearId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return {
      semester,
      passSemesterScore: params?.semesterPassScore ?? 5,
    };
  }

  private async findClass(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        gradeLevel: true,
        schoolYear: true,
      },
    });
    if (!classItem) {
      throw new BadRequestException({
        errorKey: 'REPORT_DATA_NOT_READY',
        message: 'Lop hoc khong hop le',
      });
    }
    return classItem;
  }

  private isOfficial(sheets: ScoreSheetForReport[]) {
    return (
      sheets.length > 0 &&
      sheets.every((sheet) => sheet.status === ScoreSheetStatus.LOCKED)
    );
  }

  private roundAverage(values: number[]) {
    if (values.length === 0) {
      return null;
    }
    return (
      Math.round(
        (values.reduce((sum, value) => sum + value, 0) / values.length) * 100,
      ) / 100
    );
  }

  private forbiddenReportScope() {
    return new ForbiddenException({
      errorKey: 'FORBIDDEN_REPORT_SCOPE',
      message: 'Khong co quyen xem bao cao trong pham vi nay',
    });
  }
}
