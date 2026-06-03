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
import { calculateSubjectAverage } from '../scores/score-average.util';
import { CreateScoreChangeRequestDto } from './dto/create-score-change-request.dto';
import { ReviewScoreChangeRequestDto } from './dto/review-score-change-request.dto';
import { ScoreChangeRequestQueryDto } from './dto/score-change-request-query.dto';

const SCORE_CHANGE_REQUEST_INCLUDE = {
  scoreSheet: {
    include: {
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
    },
  },
  studentSubjectScore: {
    include: {
      student: true,
      scoreDetails: {
        include: {
          testType: true,
        },
      },
    },
  },
  scoreDetail: {
    include: {
      testType: true,
    },
  },
  testType: true,
  requestedBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
      teacherId: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
};

type ScoreChangeRequestWithRelations = Prisma.ScoreChangeRequestGetPayload<{
  include: typeof SCORE_CHANGE_REQUEST_INCLUDE;
}>;

@Injectable()
export class ScoreChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionScope: PermissionScopeService,
  ) {}

  async findAll(query: ScoreChangeRequestQueryDto, user: AuthenticatedUser) {
    const where = this.buildRequestWhere(query, user);

    return this.prisma.scoreChangeRequest.findMany({
      where,
      include: SCORE_CHANGE_REQUEST_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const request = await this.findRequestOrThrow(id);
    this.ensureCanViewRequest(user, request);
    return request;
  }

  async create(dto: CreateScoreChangeRequestDto, user: AuthenticatedUser) {
    if (user.role !== 'TEACHER' || !user.teacherId) {
      throw new ForbiddenException({
        errorKey: 'NOT_SUBJECT_TEACHER',
        message: 'Chi GVBM moi duoc tao yeu cau sua diem',
      });
    }

    const scoreSheet = await this.prisma.scoreSheet.findUnique({
      where: { id: dto.scoreSheetId },
      include: {
        semester: true,
      },
    });
    if (!scoreSheet) {
      throw new NotFoundException({
        errorKey: 'SCORE_SHEET_NOT_FOUND',
        message: 'Khong tim thay bang diem',
      });
    }

    if (scoreSheet.status !== ScoreSheetStatus.LOCKED) {
      throw new BadRequestException({
        errorKey: 'SCORE_SHEET_LOCKED',
        message: 'Chi tao yeu cau sua diem khi bang diem da LOCKED',
      });
    }

    const isSubjectTeacher = await this.permissionScope.isSubjectTeacherOfClass(
      user.teacherId,
      scoreSheet.classId,
      scoreSheet.subjectId,
      scoreSheet.semesterId,
    );
    if (!isSubjectTeacher) {
      throw new ForbiddenException({
        errorKey: 'NOT_SUBJECT_TEACHER',
        message: 'Khong phai GVBM cua bang diem nay',
      });
    }

    const params = await this.getScoreParameters(
      scoreSheet.semester.schoolYearId,
    );
    this.ensureScoreInRange(dto.newValue, params.minScore, params.maxScore);

    const testTypeCode = dto.testTypeCode ?? dto.scoreType;
    const testType = await this.prisma.testType.findUnique({
      where: { code: testTypeCode },
    });
    if (!testType) {
      throw new BadRequestException({
        errorKey: 'INVALID_TEST_TYPE',
        message: 'Loai diem khong hop le',
      });
    }

    const studentSubjectScore =
      await this.prisma.studentSubjectScore.findUnique({
        where: {
          scoreSheetId_studentId: {
            scoreSheetId: scoreSheet.id,
            studentId: dto.studentId,
          },
        },
      });
    if (!studentSubjectScore) {
      throw new BadRequestException({
        errorKey: 'STUDENT_NOT_IN_CLASS',
        message: 'Hoc sinh chua co diem trong bang diem nay',
      });
    }

    const attemptNo = dto.attemptNo ?? 1;
    const scoreDetail = await this.prisma.scoreDetail.findUnique({
      where: {
        studentSubjectScoreId_testTypeId_attemptNo: {
          studentSubjectScoreId: studentSubjectScore.id,
          testTypeId: testType.id,
          attemptNo,
        },
      },
    });
    if (!scoreDetail) {
      throw new BadRequestException({
        errorKey: 'SCORE_DETAIL_NOT_FOUND',
        message: 'Khong tim thay diem thanh phan can sua',
      });
    }

    const duplicated = await this.prisma.scoreChangeRequest.findFirst({
      where: {
        scoreSheetId: scoreSheet.id,
        studentSubjectScoreId: studentSubjectScore.id,
        testTypeId: testType.id,
        attemptNo,
        status: 'PENDING',
      },
    });
    if (duplicated) {
      throw new ConflictException({
        errorKey: 'SCORE_CHANGE_REQUEST_DUPLICATED',
        message: 'Da co yeu cau sua diem dang cho xu ly',
      });
    }

    return this.prisma.scoreChangeRequest.create({
      data: {
        scoreSheetId: scoreSheet.id,
        studentSubjectScoreId: studentSubjectScore.id,
        scoreDetailId: scoreDetail.id,
        testTypeId: testType.id,
        attemptNo,
        oldScore: dto.oldValue,
        newScore: dto.newValue,
        reason: dto.reason,
        status: 'PENDING',
        requestedById: user.id,
      },
      include: SCORE_CHANGE_REQUEST_INCLUDE,
    });
  }

  async approve(
    id: number,
    dto: ReviewScoreChangeRequestDto,
    user: AuthenticatedUser,
  ) {
    this.ensureAcademicStaff(user);
    const request = await this.findRequestOrThrow(id);
    this.ensurePending(request);

    const params = await this.getScoreParameters(
      request.scoreSheet.semester.schoolYearId,
    );
    this.ensureScoreInRange(request.newScore, params.minScore, params.maxScore);

    return this.prisma.$transaction(async (tx) => {
      const scoreDetail = await tx.scoreDetail.update({
        where: { id: request.scoreDetailId! },
        data: { score: request.newScore },
        include: { testType: true },
      });

      const scoreDetails = await tx.scoreDetail.findMany({
        where: { studentSubjectScoreId: request.studentSubjectScoreId },
        include: { testType: true },
      });
      const averageScore = calculateSubjectAverage(scoreDetails);

      await tx.studentSubjectScore.update({
        where: { id: request.studentSubjectScoreId },
        data: {
          averageScore,
          passStatus:
            averageScore === null ? null : averageScore >= params.passScore,
          calculatedAt: new Date(),
        },
      });

      const updatedRequest = await tx.scoreChangeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote,
          scoreDetailId: scoreDetail.id,
        },
        include: SCORE_CHANGE_REQUEST_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPROVE_SCORE_CHANGE_REQUEST',
          entityType: 'ScoreChangeRequest',
          entityId: id,
          oldValue: JSON.stringify({
            score: request.oldScore,
            status: request.status,
          }),
          newValue: JSON.stringify({
            score: request.newScore,
            status: 'APPROVED',
            averageScore,
          }),
        },
      });

      return updatedRequest;
    });
  }

  async reject(
    id: number,
    dto: ReviewScoreChangeRequestDto,
    user: AuthenticatedUser,
  ) {
    this.ensureAcademicStaff(user);
    const request = await this.findRequestOrThrow(id);
    this.ensurePending(request);

    return this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.scoreChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNote: dto.rejectReason ?? dto.reviewNote,
        },
        include: SCORE_CHANGE_REQUEST_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REJECT_SCORE_CHANGE_REQUEST',
          entityType: 'ScoreChangeRequest',
          entityId: id,
          oldValue: JSON.stringify({ status: request.status }),
          newValue: JSON.stringify({
            status: 'REJECTED',
            reviewNote: updatedRequest.reviewNote,
          }),
        },
      });

      return updatedRequest;
    });
  }

  private buildRequestWhere(
    query: ScoreChangeRequestQueryDto,
    user: AuthenticatedUser,
  ): Prisma.ScoreChangeRequestWhereInput {
    const and: Prisma.ScoreChangeRequestWhereInput[] = [];

    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.scoreSheetId) {
      and.push({ scoreSheetId: query.scoreSheetId });
    }

    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return and.length > 0 ? { AND: and } : {};
    }

    if (user.role === 'TEACHER') {
      and.push({ requestedById: user.id });
      return { AND: and };
    }

    throw new ForbiddenException({
      errorKey: 'FORBIDDEN',
      message: 'Khong co quyen xem yeu cau sua diem',
    });
  }

  private ensureCanViewRequest(
    user: AuthenticatedUser,
    request: ScoreChangeRequestWithRelations,
  ) {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return true;
    }

    if (user.role === 'TEACHER' && request.requestedById === user.id) {
      return true;
    }

    throw new ForbiddenException({
      errorKey: 'FORBIDDEN',
      message: 'Khong co quyen xem yeu cau sua diem nay',
    });
  }

  private ensureAcademicStaff(user: AuthenticatedUser) {
    if (user.role !== 'ACADEMIC_STAFF') {
      throw new ForbiddenException({
        errorKey: 'ONLY_ACADEMIC_STAFF_CAN_APPROVE',
        message: 'Chi giao vu duoc duyet yeu cau sua diem',
      });
    }
  }

  private ensurePending(request: ScoreChangeRequestWithRelations) {
    if (request.status !== 'PENDING') {
      throw new ConflictException({
        errorKey: 'SCORE_CHANGE_REQUEST_ALREADY_PROCESSED',
        message: 'Yeu cau sua diem da duoc xu ly',
      });
    }
  }

  private async findRequestOrThrow(
    id: number,
  ): Promise<ScoreChangeRequestWithRelations> {
    const request = await this.prisma.scoreChangeRequest.findUnique({
      where: { id },
      include: SCORE_CHANGE_REQUEST_INCLUDE,
    });

    if (!request) {
      throw new NotFoundException({
        errorKey: 'SCORE_CHANGE_REQUEST_NOT_FOUND',
        message: 'Khong tim thay yeu cau sua diem',
      });
    }

    return request;
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

  private ensureScoreInRange(
    score: number,
    minScore: number,
    maxScore: number,
  ) {
    if (score < minScore || score > maxScore) {
      throw new BadRequestException({
        errorKey: 'SCORE_INVALID_RANGE',
        message: `Diem phai nam trong khoang ${minScore} den ${maxScore}`,
      });
    }
  }
}
