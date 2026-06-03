import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types';
import { AuditLogService } from '../common/audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConductAssessmentDto } from './dto/create-conduct-assessment.dto';
import { FinalizeConductDto } from './dto/finalize-conduct.dto';
import { UpdateConductAssessmentDto } from './dto/update-conduct-assessment.dto';

const CONDUCT_INCLUDE = {
  student: { select: { id: true, studentCode: true, fullName: true, gender: true } },
  class:   { select: { id: true, name: true } },
  semester: { include: { schoolYear: true } },
  criteria: true,
  submittedBy: { select: { id: true, username: true, fullName: true } },
  reviewedBy:  { select: { id: true, username: true, fullName: true } },
} as const;

/** Tính xếp loại từ các tiêu chí con theo quy tắc đa số */
function deriveRating(criteriaRatings: string[]): string {
  if (criteriaRatings.length === 0) return 'AVERAGE';
  const weights = { EXCELLENT: 4, GOOD: 3, AVERAGE: 2, WEAK: 1 };
  const sum = criteriaRatings.reduce((acc, r) => acc + (weights[r as keyof typeof weights] ?? 2), 0);
  const avg = sum / criteriaRatings.length;
  if (avg >= 3.5) return 'EXCELLENT';
  if (avg >= 2.5) return 'GOOD';
  if (avg >= 1.5) return 'AVERAGE';
  return 'WEAK';
}

@Injectable()
export class ConductAssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(query: { semesterId?: number; classId?: number }, user: AuthenticatedUser) {
    const where: Record<string, unknown> = {};

    if (query.semesterId) where['semesterId'] = query.semesterId;

    if (user.role === 'TEACHER') {
      if (!user.teacherId) throw new ForbiddenException('Không có hồ sơ giáo viên');
      // GVCN chỉ thấy lớp chủ nhiệm của mình
      const homeroomClasses = await this.prisma.teacherAssignment.findMany({
        where: { teacherId: user.teacherId, assignmentType: 'HOMEROOM', isActive: true },
        select: { classId: true },
      });
      const classIds = homeroomClasses.map(a => a.classId);
      where['classId'] = { in: classIds };
    } else if (query.classId) {
      where['classId'] = query.classId;
    }

    return this.prisma.conductAssessment.findMany({
      where,
      include: CONDUCT_INCLUDE,
      orderBy: [{ class: { name: 'asc' } }, { student: { studentCode: 'asc' } }],
    });
  }

  async findOne(id: number) {
    const assessment = await this.prisma.conductAssessment.findUnique({
      where: { id },
      include: CONDUCT_INCLUDE,
    });
    if (!assessment) throw new NotFoundException('Không tìm thấy đánh giá hạnh kiểm');
    return assessment;
  }

  async findByStudent(studentId: number, user: AuthenticatedUser) {
    if (user.role === 'STUDENT' && user.studentId !== studentId) {
      throw new ForbiddenException('Chỉ xem hạnh kiểm của chính mình');
    }
    return this.prisma.conductAssessment.findMany({
      where: { studentId, status: 'FINALIZED' },
      include: CONDUCT_INCLUDE,
      orderBy: { semester: { startDate: 'desc' } },
    });
  }

  /** GVCN tạo đánh giá cho một học sinh */
  async create(dto: CreateConductAssessmentDto, user: AuthenticatedUser) {
    if (user.role !== 'TEACHER' || !user.teacherId) {
      throw new ForbiddenException('Chỉ GVCN mới được tạo đánh giá hạnh kiểm');
    }

    // Kiểm tra đây có phải GVCN của lớp không
    const isHomeroom = await this.prisma.teacherAssignment.findFirst({
      where: { teacherId: user.teacherId, classId: dto.classId, assignmentType: 'HOMEROOM', isActive: true },
    });
    if (!isHomeroom) throw new ForbiddenException('Chỉ GVCN của lớp mới được tạo đánh giá');

    return this.prisma.conductAssessment.upsert({
      where: { studentId_semesterId: { studentId: dto.studentId, semesterId: dto.semesterId } },
      update: {},
      create: {
        studentId: dto.studentId,
        semesterId: dto.semesterId,
        classId: dto.classId,
        status: 'DRAFT',
        submittedById: user.id,
      },
      include: CONDUCT_INCLUDE,
    });
  }

  /** GVCN cập nhật tiêu chí */
  async update(id: number, dto: UpdateConductAssessmentDto, user: AuthenticatedUser) {
    const assessment = await this.findOne(id);
    if (assessment.status !== 'DRAFT') {
      throw new BadRequestException({ errorKey: 'CONDUCT_NOT_DRAFT', message: 'Chỉ cập nhật khi còn DRAFT' });
    }
    if (user.role === 'TEACHER' && assessment.submittedById !== user.id) {
      throw new ForbiddenException('Chỉ GVCN tạo ra đánh giá mới được cập nhật');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.criteria) {
        await tx.conductCriterion.deleteMany({ where: { assessmentId: id } });
        await tx.conductCriterion.createMany({
          data: dto.criteria.map(c => ({ assessmentId: id, code: c.code, rating: c.rating, note: c.note })),
        });
      }
      return tx.conductAssessment.update({
        where: { id },
        data: { teacherNote: dto.teacherNote },
        include: CONDUCT_INCLUDE,
      });
    });
  }

  /** GVCN nộp đánh giá */
  async submit(id: number, user: AuthenticatedUser) {
    const assessment = await this.findOne(id);
    if (assessment.status !== 'DRAFT') {
      throw new BadRequestException({ errorKey: 'CONDUCT_NOT_DRAFT', message: 'Chỉ nộp khi còn DRAFT' });
    }

    // Tự tính xếp loại từ tiêu chí nếu chưa đặt
    const criteriaRatings = assessment.criteria.map(c => c.rating);
    const autoRating = criteriaRatings.length > 0 ? deriveRating(criteriaRatings) : null;

    return this.prisma.conductAssessment.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        finalRating: assessment.finalRating ?? autoRating,
      },
      include: CONDUCT_INCLUDE,
    });
  }

  /** Giáo vụ chốt xếp loại */
  async finalize(id: number, dto: FinalizeConductDto, user: AuthenticatedUser) {
    const assessment = await this.findOne(id);
    if (assessment.status !== 'SUBMITTED') {
      throw new BadRequestException({ errorKey: 'CONDUCT_NOT_SUBMITTED', message: 'Chỉ chốt khi trạng thái SUBMITTED' });
    }

    const updated = await this.prisma.conductAssessment.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        finalRating: dto.finalRating,
        reviewNote: dto.reviewNote,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      include: CONDUCT_INCLUDE,
    });

    void this.auditLog.log({
      userId: user.id,
      action: 'FINALIZE_CONDUCT',
      entityType: 'ConductAssessment',
      entityId: id,
      oldValue: { status: 'SUBMITTED', finalRating: assessment.finalRating },
      newValue: { status: 'FINALIZED', finalRating: dto.finalRating },
    });

    return updated;
  }

  /** Tạo hàng loạt đánh giá cho tất cả học sinh trong lớp */
  async createBatch(
    semesterId: number,
    classId: number,
    user: AuthenticatedUser,
  ) {
    if (user.role !== 'TEACHER' || !user.teacherId) {
      throw new ForbiddenException('Chỉ GVCN mới được tạo đánh giá hạnh kiểm');
    }

    const isHomeroom = await this.prisma.teacherAssignment.findFirst({
      where: { teacherId: user.teacherId, classId, assignmentType: 'HOMEROOM', isActive: true },
    });
    if (!isHomeroom) throw new ForbiddenException('Chỉ GVCN của lớp mới được tạo đánh giá');

    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classId, semesterId, status: 'ACTIVE' },
      select: { studentId: true },
    });

    let created = 0;
    for (const { studentId } of enrollments) {
      const existing = await this.prisma.conductAssessment.findUnique({
        where: { studentId_semesterId: { studentId, semesterId } },
      });
      if (!existing) {
        await this.prisma.conductAssessment.create({
          data: { studentId, semesterId, classId, status: 'DRAFT', submittedById: user.id },
        });
        created++;
      }
    }

    return { classId, semesterId, created, total: enrollments.length };
  }
}
