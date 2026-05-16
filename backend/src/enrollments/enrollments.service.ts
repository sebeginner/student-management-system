import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { AssignEnrollmentDto } from './dto/assign-enrollment.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { TransferEnrollmentDto } from './dto/transfer-enrollment.dto';

const ENROLLMENT_INCLUDE = {
  student: true,
  class: {
    include: {
      gradeLevel: true,
      schoolYear: true,
      homeroomTeacher: true,
    },
  },
  semester: {
    include: {
      schoolYear: true,
    },
  },
};

type EnrollmentWithClass = Prisma.StudentClassEnrollmentGetPayload<{
  include: {
    class: {
      include: {
        gradeLevel: true;
      };
    };
  };
}>;

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: EnrollmentQueryDto, user: AuthenticatedUser) {
    const where = this.buildAccessibleWhere(query, user);

    return this.prisma.studentClassEnrollment.findMany({
      where,
      include: ENROLLMENT_INCLUDE,
      orderBy: [{ enrolledAt: 'desc' }, { id: 'desc' }],
    });
  }

  async findByStudent(studentId: number, user: AuthenticatedUser) {
    if (user.role === 'STUDENT' && user.studentId !== studentId) {
      throw new ForbiddenException(
        'Khong co quyen xem lich su lop cua hoc sinh khac',
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw this.studentNotFound();
    }

    const where = this.buildAccessibleWhere({ studentId }, user);
    return this.prisma.studentClassEnrollment.findMany({
      where,
      include: ENROLLMENT_INCLUDE,
      orderBy: [{ enrolledAt: 'desc' }, { id: 'desc' }],
    });
  }

  async assign(dto: AssignEnrollmentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw this.studentNotFound();
    }

    const classItem = await this.findClassForWrite(dto.classId);
    await this.ensureSemesterExists(dto.semesterId);
    await this.ensureNoActiveEnrollment(dto.studentId, dto.semesterId);
    await this.ensureClassHasCapacity(
      dto.classId,
      dto.semesterId,
      classItem.maxSize,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const enrollment = await tx.studentClassEnrollment.create({
          data: {
            studentId: dto.studentId,
            classId: dto.classId,
            semesterId: dto.semesterId,
            status: 'ACTIVE',
            reason: dto.reason,
          },
          include: ENROLLMENT_INCLUDE,
        });

        await this.syncClassSize(tx, dto.classId, dto.semesterId);
        await tx.student.update({
          where: { id: dto.studentId },
          data: { status: 'ACTIVE' },
        });

        return enrollment;
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async transfer(dto: TransferEnrollmentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw this.studentNotFound();
    }

    await this.ensureSemesterExists(dto.semesterId);
    const currentEnrollment = await this.findActiveEnrollment(
      dto.studentId,
      dto.semesterId,
      dto.fromClassId,
    );
    const targetClass = await this.findClassForWrite(dto.toClassId);

    if (currentEnrollment.classId === dto.toClassId) {
      throw new ConflictException({
        errorKey: 'STUDENT_ALREADY_ENROLLED',
        message: 'Hoc sinh dang hoc trong lop nay',
      });
    }

    if (currentEnrollment.class.gradeLevelId !== targetClass.gradeLevelId) {
      throw new BadRequestException({
        errorKey: 'INVALID_TRANSFER_DIFFERENT_GRADE',
        message: 'Chi duoc chuyen lop trong cung khoi',
      });
    }

    await this.ensureClassHasCapacity(
      dto.toClassId,
      dto.semesterId,
      targetClass.maxSize,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.studentClassEnrollment.update({
          where: { id: currentEnrollment.id },
          data: {
            status: 'TRANSFERRED',
            endedAt: new Date(),
            reason: dto.reason,
          },
        });

        const newEnrollment = await tx.studentClassEnrollment.create({
          data: {
            studentId: dto.studentId,
            classId: dto.toClassId,
            semesterId: dto.semesterId,
            status: 'ACTIVE',
            reason: dto.reason,
          },
          include: ENROLLMENT_INCLUDE,
        });

        await this.syncClassSize(tx, currentEnrollment.classId, dto.semesterId);
        await this.syncClassSize(tx, dto.toClassId, dto.semesterId);

        return newEnrollment;
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private buildAccessibleWhere(
    query: EnrollmentQueryDto,
    user: AuthenticatedUser,
  ): Prisma.StudentClassEnrollmentWhereInput {
    const and: Prisma.StudentClassEnrollmentWhereInput[] = [];

    if (query.studentId) {
      and.push({ studentId: query.studentId });
    }

    if (query.classId) {
      and.push({ classId: query.classId });
    }

    if (query.semesterId) {
      and.push({ semesterId: query.semesterId });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    and.push(this.scopeWhere(user));

    return and.length > 0 ? { AND: and } : {};
  }

  private scopeWhere(
    user: AuthenticatedUser,
  ): Prisma.StudentClassEnrollmentWhereInput {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return {};
    }

    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        throw new ForbiddenException('Khong co ho so hoc sinh lien ket');
      }
      return { studentId: user.studentId };
    }

    if (user.role === 'TEACHER') {
      if (!user.teacherId) {
        throw new ForbiddenException('Khong co ho so giao vien lien ket');
      }

      return {
        class: {
          OR: [
            { homeroomTeacherId: user.teacherId },
            {
              assignments: {
                some: {
                  teacherId: user.teacherId,
                  assignmentType: 'HOMEROOM',
                  isActive: true,
                },
              },
            },
          ],
        },
      };
    }

    throw new ForbiddenException('Khong co quyen truy cap lich su lop');
  }

  private async findClassForWrite(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { gradeLevel: true },
    });

    if (!classItem) {
      throw this.classNotFound();
    }

    return classItem;
  }

  private async ensureSemesterExists(semesterId: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new BadRequestException({
        errorKey: 'INVALID_SEMESTER',
        message: 'Hoc ky khong hop le',
      });
    }
  }

  private async ensureNoActiveEnrollment(
    studentId: number,
    semesterId: number,
  ) {
    const existing = await this.prisma.studentClassEnrollment.findFirst({
      where: { studentId, semesterId, status: 'ACTIVE' },
    });

    if (existing) {
      throw new ConflictException({
        errorKey: 'STUDENT_ALREADY_ENROLLED',
        message: 'Hoc sinh da co lop active trong hoc ky nay',
      });
    }
  }

  private async findActiveEnrollment(
    studentId: number,
    semesterId: number,
    fromClassId?: number,
  ): Promise<EnrollmentWithClass> {
    const enrollment = await this.prisma.studentClassEnrollment.findFirst({
      where: {
        studentId,
        semesterId,
        status: 'ACTIVE',
        classId: fromClassId,
      },
      include: {
        class: {
          include: {
            gradeLevel: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException({
        errorKey: 'ENROLLMENT_NOT_FOUND',
        message: 'Khong tim thay enrollment active',
      });
    }

    return enrollment;
  }

  private async ensureClassHasCapacity(
    classId: number,
    semesterId: number,
    maxSize: number,
  ) {
    const activeCount = await this.prisma.studentClassEnrollment.count({
      where: { classId, semesterId, status: 'ACTIVE' },
    });

    if (activeCount >= maxSize) {
      throw new BadRequestException({
        errorKey: 'CLASS_FULL',
        message: 'Lop da du si so',
      });
    }
  }

  private async syncClassSize(
    tx: Prisma.TransactionClient,
    classId: number,
    semesterId: number,
  ) {
    const activeCount = await tx.studentClassEnrollment.count({
      where: { classId, semesterId, status: 'ACTIVE' },
    });

    await tx.class.update({
      where: { id: classId },
      data: { currentSize: activeCount },
    });
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        errorKey: 'STUDENT_ALREADY_ENROLLED',
        message: 'Hoc sinh da co lop active trong hoc ky nay',
      });
    }
    throw error;
  }

  private studentNotFound() {
    return new NotFoundException({
      errorKey: 'STUDENT_NOT_FOUND',
      message: 'Khong tim thay hoc sinh',
    });
  }

  private classNotFound() {
    return new NotFoundException({
      errorKey: 'CLASS_NOT_FOUND',
      message: 'Khong tim thay lop hoc',
    });
  }
}
