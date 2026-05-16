import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ScoreSheetStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PermissionScopeService } from '../authorization/permission-scope.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScoreSheetDto } from './dto/create-score-sheet.dto';
import { ScoreSheetQueryDto } from './dto/score-sheet-query.dto';
import { UpdateStudentScoreDto } from './dto/update-student-score.dto';
import { calculateSubjectAverage } from './score-average.util';

const SCORE_SHEET_INCLUDE = {
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
      scoreDetails: {
        include: {
          testType: true,
        },
        orderBy: [
          { testTypeId: 'asc' as const },
          { attemptNo: 'asc' as const },
        ],
      },
    },
    orderBy: { studentId: 'asc' as const },
  },
};

type ScoreSheetWithRelations = Prisma.ScoreSheetGetPayload<{
  include: typeof SCORE_SHEET_INCLUDE;
}>;

@Injectable()
export class ScoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionScope: PermissionScopeService,
  ) {}

  async findSheets(query: ScoreSheetQueryDto, user: AuthenticatedUser) {
    const where = await this.buildSheetWhere(query, user);

    return this.prisma.scoreSheet.findMany({
      where,
      include: SCORE_SHEET_INCLUDE,
      orderBy: [
        { semesterId: 'desc' },
        { classId: 'asc' },
        { subjectId: 'asc' },
      ],
    });
  }

  async createSheet(dto: CreateScoreSheetDto, user: AuthenticatedUser) {
    await this.permissionScope.canSubmitScoreSheet(
      user,
      dto.classId,
      dto.subjectId,
      dto.semesterId,
    );

    try {
      return await this.prisma.scoreSheet.upsert({
        where: {
          classId_subjectId_semesterId: {
            classId: dto.classId,
            subjectId: dto.subjectId,
            semesterId: dto.semesterId,
          },
        },
        update: {},
        create: {
          classId: dto.classId,
          subjectId: dto.subjectId,
          semesterId: dto.semesterId,
          status: ScoreSheetStatus.DRAFT,
          createdBy: user.id,
        },
        include: SCORE_SHEET_INCLUDE,
      });
    } catch (error) {
      this.handleCreateSheetError(error);
    }
  }

  async findSheet(id: number, user: AuthenticatedUser) {
    const sheet = await this.findSheetOrThrow(id);
    await this.ensureCanViewSheet(user, sheet);
    return sheet;
  }

  async updateStudentScore(
    id: number,
    studentId: number,
    dto: UpdateStudentScoreDto,
    user: AuthenticatedUser,
  ) {
    const sheet = await this.findSheetOrThrow(id);
    await this.permissionScope.canEditSubjectScore(
      user,
      sheet.classId,
      sheet.subjectId,
      sheet.semesterId,
      sheet.status,
    );
    await this.ensureStudentInClass(studentId, sheet.classId, sheet.semesterId);

    const params = await this.getScoreParameters(sheet.semester.schoolYearId);
    this.validateScoreRange(dto, params.minScore, params.maxScore);

    return this.prisma.$transaction(async (tx) => {
      const studentSubjectScore = await tx.studentSubjectScore.upsert({
        where: {
          scoreSheetId_studentId: {
            scoreSheetId: sheet.id,
            studentId,
          },
        },
        update: {},
        create: {
          scoreSheetId: sheet.id,
          studentId,
        },
      });

      const testTypes = await tx.testType.findMany({
        where: {
          code: { in: dto.details.map((detail) => detail.testTypeCode) },
        },
      });
      const testTypeByCode = new Map(
        testTypes.map((testType) => [testType.code, testType]),
      );

      for (const detail of dto.details) {
        const testType = testTypeByCode.get(detail.testTypeCode);
        if (!testType) {
          throw new BadRequestException({
            errorKey: 'INVALID_TEST_TYPE',
            message: 'Loai diem khong hop le',
          });
        }

        await tx.scoreDetail.upsert({
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

      const scoreDetails = await tx.scoreDetail.findMany({
        where: { studentSubjectScoreId: studentSubjectScore.id },
        include: { testType: true },
      });
      const averageScore = calculateSubjectAverage(scoreDetails);

      return tx.studentSubjectScore.update({
        where: { id: studentSubjectScore.id },
        data: {
          averageScore,
          passStatus:
            averageScore === null ? null : averageScore >= params.passScore,
          calculatedAt: new Date(),
        },
        include: {
          student: true,
          scoreSheet: {
            include: {
              class: true,
              subject: true,
              semester: true,
            },
          },
          scoreDetails: {
            include: { testType: true },
            orderBy: [{ testTypeId: 'asc' }, { attemptNo: 'asc' }],
          },
        },
      });
    });
  }

  async submitSheet(id: number, user: AuthenticatedUser) {
    const sheet = await this.findSheetOrThrow(id);
    if (user.role !== 'TEACHER') {
      throw new ForbiddenException({
        errorKey: 'NOT_SUBJECT_TEACHER',
        message: 'Chi GVBM cua bang diem duoc submit',
      });
    }
    await this.permissionScope.canSubmitScoreSheet(
      user,
      sheet.classId,
      sheet.subjectId,
      sheet.semesterId,
    );

    const activeStudentIds = await this.getActiveStudentIds(
      sheet.classId,
      sheet.semesterId,
    );
    const missingStudentIds = await this.getStudentsMissingRequiredScores(
      sheet.id,
      activeStudentIds,
    );
    if (missingStudentIds.length > 0) {
      throw new BadRequestException({
        errorKey: 'SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES',
        message: 'Bang diem con thieu diem giua ky hoac cuoi ky',
        missingStudentIds,
      });
    }

    return this.prisma.scoreSheet.update({
      where: { id },
      data: {
        status: ScoreSheetStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: SCORE_SHEET_INCLUDE,
    });
  }

  async lockSheet(id: number, user: AuthenticatedUser) {
    const sheet = await this.findSheetOrThrow(id);
    this.permissionScope.canLockScoreSheet(user);

    if (sheet.status === ScoreSheetStatus.LOCKED) {
      throw new ConflictException({
        errorKey: 'SCORE_SHEET_ALREADY_LOCKED',
        message: 'Bang diem da duoc khoa',
      });
    }

    if (sheet.status !== ScoreSheetStatus.SUBMITTED) {
      throw new BadRequestException({
        errorKey: 'SCORE_SHEET_NOT_SUBMITTED',
        message: 'Chi duoc khoa bang diem da submit',
      });
    }

    const activeStudentIds = await this.getActiveStudentIds(
      sheet.classId,
      sheet.semesterId,
    );
    const missingStudentIds = await this.getStudentsMissingRequiredScores(
      sheet.id,
      activeStudentIds,
    );
    if (missingStudentIds.length > 0) {
      throw new BadRequestException({
        errorKey: 'SCORE_SHEET_SUBMIT_MISSING_REQUIRED_SCORES',
        message: 'Bang diem con thieu diem giua ky hoac cuoi ky',
        missingStudentIds,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.scoreSheet.update({
        where: { id },
        data: {
          status: ScoreSheetStatus.LOCKED,
          lockedAt: new Date(),
        },
        include: SCORE_SHEET_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOCK_SCORE_SHEET',
          entityType: 'ScoreSheet',
          entityId: id,
          oldValue: JSON.stringify({
            status: sheet.status,
            lockedAt: sheet.lockedAt,
          }),
          newValue: JSON.stringify({
            status: updated.status,
            lockedAt: updated.lockedAt,
          }),
        },
      });

      return updated;
    });
  }

  async unlockSheet(id: number, user: AuthenticatedUser) {
    const sheet = await this.findSheetOrThrow(id);
    this.permissionScope.canLockScoreSheet(user);

    if (sheet.status !== ScoreSheetStatus.LOCKED) {
      throw new BadRequestException({
        errorKey: 'SCORE_SHEET_NOT_SUBMITTED',
        message: 'Chi mo khoa bang diem dang LOCKED',
      });
    }

    if (await this.hasOfficialReport(sheet)) {
      throw new BadRequestException({
        errorKey: 'CANNOT_UNLOCK_REPORTED_SCORE_SHEET',
        message: 'Khong the mo khoa bang diem da co bao cao chinh thuc',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.scoreSheet.update({
        where: { id },
        data: {
          status: ScoreSheetStatus.NEEDS_CORRECTION,
          lockedAt: null,
        },
        include: SCORE_SHEET_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UNLOCK_SCORE_SHEET',
          entityType: 'ScoreSheet',
          entityId: id,
          oldValue: JSON.stringify({
            status: sheet.status,
            lockedAt: sheet.lockedAt,
          }),
          newValue: JSON.stringify({
            status: updated.status,
            lockedAt: updated.lockedAt,
          }),
        },
      });

      return updated;
    });
  }

  async getMyScores(user: AuthenticatedUser) {
    if (user.role !== 'STUDENT' || !user.studentId) {
      throw new ForbiddenException({
        errorKey: 'NOT_STUDENT_OWNER',
        message: 'Chi hoc sinh moi xem diem ca nhan tai endpoint nay',
      });
    }

    await this.permissionScope.canViewStudentScores(user, user.studentId);

    return this.prisma.studentSubjectScore.findMany({
      where: { studentId: user.studentId },
      include: {
        scoreSheet: {
          include: {
            class: {
              include: {
                gradeLevel: true,
                schoolYear: true,
              },
            },
            subject: true,
            semester: true,
          },
        },
        scoreDetails: {
          include: { testType: true },
          orderBy: [{ testTypeId: 'asc' }, { attemptNo: 'asc' }],
        },
      },
      orderBy: { scoreSheetId: 'asc' },
    });
  }

  private async buildSheetWhere(
    query: ScoreSheetQueryDto,
    user: AuthenticatedUser,
  ): Promise<Prisma.ScoreSheetWhereInput> {
    const and: Prisma.ScoreSheetWhereInput[] = [];

    if (query.classId) {
      and.push({ classId: query.classId });
    }
    if (query.subjectId) {
      and.push({ subjectId: query.subjectId });
    }
    if (query.semesterId) {
      and.push({ semesterId: query.semesterId });
    }
    if (query.status) {
      and.push({ status: query.status });
    }

    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return and.length > 0 ? { AND: and } : {};
    }

    if (user.role === 'TEACHER') {
      if (!user.teacherId) {
        throw new ForbiddenException({
          errorKey: 'FORBIDDEN',
          message: 'Khong co ho so giao vien lien ket',
        });
      }
      const assignments = await this.prisma.teacherAssignment.findMany({
        where: { teacherId: user.teacherId, isActive: true },
        select: {
          classId: true,
          subjectId: true,
          semesterId: true,
          assignmentType: true,
        },
      });
      const homeroomClassIds = assignments
        .filter((assignment) => assignment.assignmentType === 'HOMEROOM')
        .map((assignment) => assignment.classId);
      const subjectScopes = assignments
        .filter(
          (assignment) =>
            assignment.assignmentType === 'SUBJECT' &&
            assignment.subjectId &&
            assignment.semesterId,
        )
        .map((assignment) => ({
          classId: assignment.classId,
          subjectId: assignment.subjectId!,
          semesterId: assignment.semesterId!,
        }));
      const or: Prisma.ScoreSheetWhereInput[] = [];
      if (homeroomClassIds.length > 0) {
        or.push({ classId: { in: homeroomClassIds } });
      }
      or.push(...subjectScopes);

      and.push(or.length > 0 ? { OR: or } : { id: -1 });
      return { AND: and };
    }

    throw new ForbiddenException({
      errorKey: 'NOT_STUDENT_OWNER',
      message: 'Hoc sinh chi xem diem ca nhan qua /scores/my-scores',
    });
  }

  private async ensureCanViewSheet(
    user: AuthenticatedUser,
    sheet: ScoreSheetWithRelations,
  ) {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return true;
    }

    if (user.role === 'TEACHER') {
      if (!user.teacherId) {
        throw new ForbiddenException({
          errorKey: 'FORBIDDEN',
          message: 'Khong co ho so giao vien lien ket',
        });
      }

      const isHomeroom = await this.permissionScope.isHomeroomTeacherOfClass(
        user.teacherId,
        sheet.classId,
        sheet.semester.schoolYearId,
      );
      if (isHomeroom) {
        return true;
      }

      const isSubjectTeacher =
        await this.permissionScope.isSubjectTeacherOfClass(
          user.teacherId,
          sheet.classId,
          sheet.subjectId,
          sheet.semesterId,
        );
      if (isSubjectTeacher) {
        return true;
      }

      throw new ForbiddenException({
        errorKey: 'NOT_SUBJECT_TEACHER',
        message: 'Khong co phan cong xem bang diem nay',
      });
    }

    throw new ForbiddenException({
      errorKey: 'NOT_STUDENT_OWNER',
      message: 'Hoc sinh chi xem diem ca nhan qua /scores/my-scores',
    });
  }

  private async findSheetOrThrow(id: number): Promise<ScoreSheetWithRelations> {
    const sheet = await this.prisma.scoreSheet.findUnique({
      where: { id },
      include: SCORE_SHEET_INCLUDE,
    });

    if (!sheet) {
      throw new NotFoundException({
        errorKey: 'SCORE_SHEET_NOT_FOUND',
        message: 'Khong tim thay bang diem',
      });
    }

    return sheet;
  }

  private async ensureStudentInClass(
    studentId: number,
    classId: number,
    semesterId: number,
  ) {
    const enrollment = await this.prisma.studentClassEnrollment.findFirst({
      where: {
        studentId,
        classId,
        semesterId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new BadRequestException({
        errorKey: 'STUDENT_NOT_IN_CLASS',
        message: 'Hoc sinh khong thuoc lop trong hoc ky nay',
      });
    }
  }

  private async getScoreParameters(schoolYearId: number) {
    const params = await this.prisma.systemParameter.findFirst({
      where: { schoolYearId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return {
      minScore: params?.minScore ?? 0,
      maxScore: params?.maxScore ?? 10,
      passScore: params?.subjectPassScore ?? 5,
    };
  }

  private validateScoreRange(
    dto: UpdateStudentScoreDto,
    minScore: number,
    maxScore: number,
  ) {
    const invalid = dto.details.find(
      (detail) => detail.score < minScore || detail.score > maxScore,
    );
    if (invalid) {
      throw new BadRequestException({
        errorKey: 'SCORE_INVALID_RANGE',
        message: `Diem phai nam trong khoang ${minScore} den ${maxScore}`,
      });
    }
  }

  private async getActiveStudentIds(classId: number, semesterId: number) {
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classId, semesterId, status: 'ACTIVE' },
      select: { studentId: true },
    });

    return enrollments.map((enrollment) => enrollment.studentId);
  }

  private async getStudentsMissingRequiredScores(
    scoreSheetId: number,
    studentIds: number[],
  ) {
    const studentScores = await this.prisma.studentSubjectScore.findMany({
      where: {
        scoreSheetId,
        studentId: { in: studentIds },
      },
      include: {
        scoreDetails: {
          include: { testType: true },
        },
      },
    });
    const scoreByStudent = new Map(
      studentScores.map((score) => [score.studentId, score]),
    );

    return studentIds.filter((studentId) => {
      const score = scoreByStudent.get(studentId);
      if (!score) {
        return true;
      }
      const hasMidterm = score.scoreDetails.some(
        (detail) => detail.testType.code === 'MIDTERM',
      );
      const hasFinal = score.scoreDetails.some(
        (detail) => detail.testType.code === 'FINAL',
      );
      return !hasMidterm || !hasFinal;
    });
  }

  private async hasOfficialReport(sheet: ScoreSheetWithRelations) {
    const [subjectReport, semesterReport] = await Promise.all([
      this.prisma.subjectReport.findFirst({
        where: {
          subjectId: sheet.subjectId,
          semesterId: sheet.semesterId,
          details: { some: { classId: sheet.classId } },
        },
        select: { id: true },
      }),
      this.prisma.semesterReport.findFirst({
        where: {
          semesterId: sheet.semesterId,
          details: { some: { classId: sheet.classId } },
        },
        select: { id: true },
      }),
    ]);

    return Boolean(subjectReport || semesterReport);
  }

  private handleCreateSheetError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException({
        errorKey: 'INVALID_SCORE_SHEET_REFERENCE',
        message: 'Lop, mon hoc hoac hoc ky khong hop le',
      });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        errorKey: 'SCORE_SHEET_EXISTS',
        message: 'Bang diem da ton tai',
      });
    }
    throw error;
  }
}
