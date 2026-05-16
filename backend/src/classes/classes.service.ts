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
import { ClassQueryDto } from './dto/class-query.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

const CLASS_INCLUDE = {
  gradeLevel: true,
  schoolYear: true,
  homeroomTeacher: true,
  assignments: {
    where: { isActive: true },
    include: {
      teacher: true,
      subject: true,
      semester: true,
    },
  },
  _count: {
    select: {
      enrollments: true,
      assignments: true,
      scoreSheets: true,
    },
  },
};

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionScope: PermissionScopeService,
  ) {}

  async findAll(query: ClassQueryDto, user: AuthenticatedUser) {
    const where = this.buildAccessibleWhere(query, user);

    return this.prisma.class.findMany({
      where,
      include: CLASS_INCLUDE,
      orderBy: [{ schoolYearId: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: CLASS_INCLUDE,
    });

    if (!classItem) {
      throw this.notFound();
    }

    await this.permissionScope.canViewClassStudents(user, id);

    return classItem;
  }

  async getStudents(id: number, user: AuthenticatedUser) {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!classItem) {
      throw this.notFound();
    }

    await this.permissionScope.canViewClassStudents(user, id);

    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: {
        classId: id,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        semester: true,
      },
      orderBy: { enrolledAt: 'asc' },
    });

    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      semester: enrollment.semester,
      student: enrollment.student,
    }));
  }

  async create(dto: CreateClassDto) {
    const maxSize =
      dto.maxSize ?? (await this.getDefaultMaxClassSize(dto.schoolYearId));

    await this.validateReferences(
      dto.gradeLevelId,
      dto.schoolYearId,
      dto.homeroomTeacherId,
    );
    await this.ensureClassNameAvailable(dto.className, dto.schoolYearId);

    try {
      return await this.prisma.class.create({
        data: {
          classCode:
            dto.classCode ??
            this.buildClassCode(dto.className, dto.schoolYearId),
          name: dto.className,
          maxSize,
          currentSize: 0,
          status: dto.status ?? 'ACTIVE',
          gradeLevelId: dto.gradeLevelId,
          schoolYearId: dto.schoolYearId,
          homeroomTeacherId: dto.homeroomTeacherId,
        },
        include: CLASS_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateClassDto) {
    const current = await this.prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!current) {
      throw this.notFound();
    }

    const nextSchoolYearId = dto.schoolYearId ?? current.schoolYearId;
    const nextClassName = dto.className ?? current.name;

    if (dto.gradeLevelId || dto.schoolYearId || dto.homeroomTeacherId) {
      await this.validateReferences(
        dto.gradeLevelId,
        dto.schoolYearId,
        dto.homeroomTeacherId,
      );
    }

    if (dto.className || dto.schoolYearId) {
      await this.ensureClassNameAvailable(nextClassName, nextSchoolYearId, id);
    }

    if (dto.maxSize !== undefined && dto.maxSize < current.currentSize) {
      throw new BadRequestException({
        errorKey: 'CLASS_FULL',
        message: 'Si so hien tai vuot qua si so toi da moi',
      });
    }

    try {
      return await this.prisma.class.update({
        where: { id },
        data: {
          classCode: dto.classCode,
          name: dto.className,
          maxSize: dto.maxSize,
          status: dto.status,
          gradeLevelId: dto.gradeLevelId,
          schoolYearId: dto.schoolYearId,
          homeroomTeacherId: dto.homeroomTeacherId,
        },
        include: CLASS_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private buildAccessibleWhere(
    query: ClassQueryDto,
    user: AuthenticatedUser,
  ): Prisma.ClassWhereInput {
    const and: Prisma.ClassWhereInput[] = [];

    if (query.keyword) {
      and.push({
        OR: [
          { name: { contains: query.keyword, mode: 'insensitive' } },
          { classCode: { contains: query.keyword, mode: 'insensitive' } },
        ],
      });
    }

    if (query.schoolYearId) {
      and.push({ schoolYearId: query.schoolYearId });
    }

    if (query.gradeLevelId) {
      and.push({ gradeLevelId: query.gradeLevelId });
    }

    and.push(this.permissionScope.classScopeWhereForUser(user));

    return and.length > 0 ? { AND: and } : {};
  }

  private async validateReferences(
    gradeLevelId?: number,
    schoolYearId?: number,
    homeroomTeacherId?: number,
  ) {
    if (gradeLevelId !== undefined) {
      const gradeLevel = await this.prisma.gradeLevel.findUnique({
        where: { id: gradeLevelId },
      });
      if (
        !gradeLevel ||
        !gradeLevel.isActive ||
        ![10, 11, 12].includes(gradeLevel.level)
      ) {
        throw new BadRequestException({
          errorKey: 'INVALID_GRADE_LEVEL',
          message: 'Khoi lop khong hop le',
        });
      }
    }

    if (schoolYearId !== undefined) {
      const schoolYear = await this.prisma.schoolYear.findUnique({
        where: { id: schoolYearId },
      });
      if (!schoolYear) {
        throw new BadRequestException({
          errorKey: 'INVALID_SCHOOL_YEAR',
          message: 'Nam hoc khong hop le',
        });
      }
    }

    if (homeroomTeacherId !== undefined) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: homeroomTeacherId },
      });
      if (!teacher) {
        throw new BadRequestException({
          errorKey: 'INVALID_TEACHER',
          message: 'Giao vien chu nhiem khong hop le',
        });
      }
    }
  }

  private async ensureClassNameAvailable(
    className: string,
    schoolYearId: number,
    currentId?: number,
  ) {
    const existing = await this.prisma.class.findUnique({
      where: {
        schoolYearId_name: {
          schoolYearId,
          name: className,
        },
      },
    });

    if (existing && existing.id !== currentId) {
      throw new ConflictException({
        errorKey: 'CLASS_NAME_EXISTS',
        message: 'Ten lop da ton tai trong nam hoc',
      });
    }
  }

  private async getDefaultMaxClassSize(schoolYearId: number) {
    const params = await this.prisma.systemParameter.findFirst({
      where: { schoolYearId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return params?.maxClassSize ?? 40;
  }

  private buildClassCode(className: string, schoolYearId: number) {
    return `${className}-${schoolYearId}`.replace(/\s+/g, '').toUpperCase();
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        errorKey: 'CLASS_NAME_EXISTS',
        message: 'Ten lop da ton tai trong nam hoc',
      });
    }
    throw error;
  }

  private notFound() {
    return new NotFoundException({
      errorKey: 'CLASS_NOT_FOUND',
      message: 'Khong tim thay lop hoc',
    });
  }
}
