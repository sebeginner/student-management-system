import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PermissionScopeService } from '../authorization/permission-scope.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const STUDENT_INCLUDE = {
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
    },
  },
  enrollments: {
    include: {
      class: {
        include: {
          gradeLevel: true,
          schoolYear: true,
        },
      },
      semester: true,
    },
    orderBy: { enrolledAt: 'desc' as const },
  },
  _count: {
    select: {
      enrollments: true,
      subjectScores: true,
    },
  },
};

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionScope: PermissionScopeService,
  ) {}

  async findAll(query: StudentQueryDto, user: AuthenticatedUser) {
    const where = await this.buildAccessibleWhere(query, user);

    return this.prisma.student.findMany({
      where,
      orderBy: { studentCode: 'asc' },
      include: STUDENT_INCLUDE,
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: STUDENT_INCLUDE,
    });

    if (!student) {
      throw this.notFound();
    }

    await this.permissionScope.canViewStudentProfile(user, id);

    return student;
  }

  async create(dto: CreateStudentDto) {
    await this.validateStudentInput(dto);

    try {
      return await this.prisma.student.create({
        data: {
          studentCode: dto.studentCode,
          fullName: dto.fullName,
          gender: dto.gender,
          dateOfBirth: new Date(dto.dateOfBirth),
          admissionDate: new Date(dto.admissionDate),
          address: dto.address,
          email: dto.email,
          status: dto.status ?? 'PENDING_CLASS_ASSIGNMENT',
          note: dto.note,
        },
        include: STUDENT_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateStudentDto) {
    const current = await this.prisma.student.findUnique({ where: { id } });
    if (!current) {
      throw this.notFound();
    }

    await this.validateStudentInput(dto, id, current);

    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          studentCode: dto.studentCode,
          fullName: dto.fullName,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          admissionDate: dto.admissionDate
            ? new Date(dto.admissionDate)
            : undefined,
          address: dto.address,
          email: dto.email,
          status: dto.status,
          note: dto.note,
        },
        include: STUDENT_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true, subjectScores: true } },
      },
    });
    if (!student) {
      throw this.notFound();
    }

    if (student._count.enrollments > 0 || student._count.subjectScores > 0) {
      return this.prisma.student.update({
        where: { id },
        data: { status: 'INACTIVE' },
        include: STUDENT_INCLUDE,
      });
    }

    return this.prisma.student.delete({
      where: { id },
      include: STUDENT_INCLUDE,
    });
  }

  private async buildAccessibleWhere(
    query: StudentQueryDto,
    user: AuthenticatedUser,
  ): Promise<Prisma.StudentWhereInput> {
    const and: Prisma.StudentWhereInput[] = [];

    if (query.keyword) {
      and.push({
        OR: [
          { studentCode: { contains: query.keyword, mode: 'insensitive' } },
          { fullName: { contains: query.keyword, mode: 'insensitive' } },
          { email: { contains: query.keyword, mode: 'insensitive' } },
        ],
      });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    if (query.classId || query.gradeLevelId) {
      and.push({
        enrollments: {
          some: {
            status: 'ACTIVE',
            classId: query.classId,
            class: query.gradeLevelId
              ? { gradeLevelId: query.gradeLevelId }
              : undefined,
          },
        },
      });
    }

    and.push(
      await this.permissionScope.studentScopeWhereForUser(user, query.classId),
    );

    return and.length > 0 ? { AND: and } : {};
  }

  private async validateStudentInput(
    dto: Partial<CreateStudentDto>,
    currentId?: number,
    current?: { dateOfBirth: Date; admissionDate: Date },
  ) {
    if (
      dto.email !== undefined &&
      dto.email !== '' &&
      !this.isValidEmail(dto.email)
    ) {
      throw new BadRequestException({
        errorKey: 'INVALID_EMAIL',
        message: 'Email khong hop le',
      });
    }

    if (dto.studentCode) {
      const existing = await this.prisma.student.findUnique({
        where: { studentCode: dto.studentCode },
      });
      if (existing && existing.id !== currentId) {
        throw new ConflictException({
          errorKey: 'STUDENT_CODE_EXISTS',
          message: 'Ma hoc sinh da ton tai',
        });
      }
    }

    const dateOfBirth = dto.dateOfBirth
      ? new Date(dto.dateOfBirth)
      : current?.dateOfBirth;
    const admissionDate = dto.admissionDate
      ? new Date(dto.admissionDate)
      : current?.admissionDate;

    if (dateOfBirth && admissionDate) {
      const params = await this.getCurrentParameters();
      const age = this.calculateAge(dateOfBirth, admissionDate);
      if (age < params.minAge || age > params.maxAge) {
        throw new BadRequestException({
          errorKey: 'STUDENT_AGE_INVALID',
          message: `Tuoi hoc sinh phai nam trong khoang ${params.minAge} den ${params.maxAge}`,
        });
      }
    }
  }

  private async getCurrentParameters() {
    const params = await this.prisma.systemParameter.findFirst({
      where: { schoolYear: { isActive: true } },
      orderBy: { effectiveFrom: 'desc' },
    });

    return {
      minAge: params?.minAge ?? 15,
      maxAge: params?.maxAge ?? 20,
    };
  }

  private calculateAge(dateOfBirth: Date, atDate: Date) {
    let age = atDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    const monthDiff = atDate.getUTCMonth() - dateOfBirth.getUTCMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && atDate.getUTCDate() < dateOfBirth.getUTCDate())
    ) {
      age -= 1;
    }
    return age;
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        errorKey: 'STUDENT_CODE_EXISTS',
        message: 'Ma hoc sinh da ton tai',
      });
    }
    throw error;
  }

  private notFound() {
    return new NotFoundException({
      errorKey: 'STUDENT_NOT_FOUND',
      message: 'Khong tim thay hoc sinh',
    });
  }
}
