import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TeacherAssignmentType } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PermissionScopeService } from '../authorization/permission-scope.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { TeacherAssignmentQueryDto } from './dto/teacher-assignment-query.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';

const ASSIGNMENT_INCLUDE = {
  teacher: {
    include: {
      subject: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
        },
      },
    },
  },
  class: {
    include: {
      gradeLevel: true,
      schoolYear: true,
    },
  },
  subject: true,
  schoolYear: true,
  semester: true,
};

type AssignmentForValidation = {
  teacherId: number;
  classId: number;
  subjectId: number | null;
  schoolYearId: number;
  semesterId: number | null;
  assignmentType: TeacherAssignmentType;
  isActive: boolean;
};

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionScope: PermissionScopeService,
  ) {}

  async findAll(query: TeacherAssignmentQueryDto, user: AuthenticatedUser) {
    const where = this.buildWhere(query, user);

    return this.prisma.teacherAssignment.findMany({
      where,
      include: ASSIGNMENT_INCLUDE,
      orderBy: [{ schoolYearId: 'desc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        id,
        ...this.assignmentScope(user),
      },
      include: ASSIGNMENT_INCLUDE,
    });

    if (!assignment) {
      throw this.notFound();
    }

    return assignment;
  }

  async findByTeacher(teacherId: number, user: AuthenticatedUser) {
    if (user.role === 'TEACHER' && user.teacherId !== teacherId) {
      throw new ForbiddenException('Chi duoc xem phan cong cua chinh minh');
    }

    await this.ensureTeacherExists(teacherId);
    return this.findAll({ teacherId }, user);
  }

  async findMine(user: AuthenticatedUser) {
    const teacher = await this.permissionScope.getTeacherByUserId(user.id);
    if (!teacher) {
      throw this.teacherNotFound();
    }

    return this.findAll({ teacherId: teacher.id }, user);
  }

  async create(dto: CreateTeacherAssignmentDto) {
    const data: AssignmentForValidation = {
      teacherId: dto.teacherId,
      classId: dto.classId,
      subjectId: dto.subjectId ?? null,
      schoolYearId: dto.schoolYearId,
      semesterId: dto.semesterId ?? null,
      assignmentType: dto.assignmentType,
      isActive: dto.isActive ?? true,
    };

    await this.validateAssignment(data);
    await this.ensureActiveAssignmentAvailable(data);

    return this.prisma.teacherAssignment.create({
      data,
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateTeacherAssignmentDto) {
    const current = await this.prisma.teacherAssignment.findUnique({
      where: { id },
    });
    if (!current) {
      throw this.notFound();
    }

    const data: AssignmentForValidation = {
      teacherId: dto.teacherId ?? current.teacherId,
      classId: dto.classId ?? current.classId,
      subjectId:
        dto.subjectId === undefined ? current.subjectId : dto.subjectId,
      schoolYearId: dto.schoolYearId ?? current.schoolYearId,
      semesterId:
        dto.semesterId === undefined ? current.semesterId : dto.semesterId,
      assignmentType: dto.assignmentType ?? current.assignmentType,
      isActive: dto.isActive ?? current.isActive,
    };

    await this.validateAssignment(data);
    await this.ensureActiveAssignmentAvailable(data, id);

    return this.prisma.teacherAssignment.update({
      where: { id },
      data,
      include: ASSIGNMENT_INCLUDE,
    });
  }

  private buildWhere(
    query: TeacherAssignmentQueryDto,
    user: AuthenticatedUser,
  ): Prisma.TeacherAssignmentWhereInput {
    const and: Prisma.TeacherAssignmentWhereInput[] = [
      this.assignmentScope(user),
    ];

    if (query.teacherId) {
      and.push({ teacherId: query.teacherId });
    }

    if (query.classId) {
      and.push({ classId: query.classId });
    }

    if (query.schoolYearId) {
      and.push({ schoolYearId: query.schoolYearId });
    }

    if (query.semesterId) {
      and.push({ semesterId: query.semesterId });
    }

    if (query.subjectId) {
      and.push({ subjectId: query.subjectId });
    }

    if (query.assignmentType) {
      and.push({ assignmentType: query.assignmentType });
    }

    if (query.isActive !== undefined) {
      and.push({ isActive: query.isActive });
    }

    return { AND: and };
  }

  private assignmentScope(
    user: AuthenticatedUser,
  ): Prisma.TeacherAssignmentWhereInput {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return {};
    }

    if (user.role === 'TEACHER') {
      if (!user.teacherId) {
        throw new ForbiddenException('Khong co ho so giao vien lien ket');
      }
      return { teacherId: user.teacherId };
    }

    throw new ForbiddenException('Khong co quyen truy cap phan cong giao vien');
  }

  private async validateAssignment(data: AssignmentForValidation) {
    await this.ensureTeacherExists(data.teacherId);
    const classItem = await this.prisma.class.findUnique({
      where: { id: data.classId },
    });
    if (!classItem) {
      throw new BadRequestException({
        errorKey: 'CLASS_NOT_FOUND',
        message: 'Khong tim thay lop hoc',
      });
    }

    const schoolYear = await this.prisma.schoolYear.findUnique({
      where: { id: data.schoolYearId },
    });
    if (!schoolYear || classItem.schoolYearId !== data.schoolYearId) {
      throw new BadRequestException({
        errorKey: 'INVALID_SCHOOL_YEAR',
        message: 'Nam hoc khong hop le voi lop',
      });
    }

    if (data.assignmentType === TeacherAssignmentType.HOMEROOM) {
      if (data.subjectId !== null) {
        throw new BadRequestException({
          errorKey: 'INVALID_HOMEROOM_ASSIGNMENT',
          message: 'GVCN khong duoc gan subjectId',
        });
      }
      return;
    }

    if (data.assignmentType === TeacherAssignmentType.SUBJECT) {
      if (!data.subjectId || !data.semesterId) {
        throw new BadRequestException({
          errorKey: 'INVALID_SUBJECT_ASSIGNMENT',
          message: 'GVBM bat buoc co subjectId va semesterId',
        });
      }

      const [subject, semester] = await Promise.all([
        this.prisma.subject.findUnique({ where: { id: data.subjectId } }),
        this.prisma.semester.findUnique({ where: { id: data.semesterId } }),
      ]);

      if (
        !subject ||
        !semester ||
        semester.schoolYearId !== data.schoolYearId
      ) {
        throw new BadRequestException({
          errorKey: 'INVALID_SUBJECT_ASSIGNMENT',
          message: 'Phan cong GVBM khong hop le',
        });
      }
      return;
    }

    throw new BadRequestException({
      errorKey: 'INVALID_SUBJECT_ASSIGNMENT',
      message: 'Loai phan cong khong hop le',
    });
  }

  private async ensureActiveAssignmentAvailable(
    data: AssignmentForValidation,
    currentId?: number,
  ) {
    if (!data.isActive) {
      return;
    }

    if (data.assignmentType === TeacherAssignmentType.HOMEROOM) {
      const existing = await this.prisma.teacherAssignment.findFirst({
        where: {
          classId: data.classId,
          schoolYearId: data.schoolYearId,
          assignmentType: TeacherAssignmentType.HOMEROOM,
          isActive: true,
          id: currentId ? { not: currentId } : undefined,
        },
      });

      if (existing) {
        throw new ConflictException({
          errorKey: 'HOMEROOM_ALREADY_ASSIGNED',
          message: 'Lop da co GVCN active trong nam hoc nay',
        });
      }
      return;
    }

    const existing = await this.prisma.teacherAssignment.findFirst({
      where: {
        classId: data.classId,
        subjectId: data.subjectId,
        semesterId: data.semesterId,
        assignmentType: TeacherAssignmentType.SUBJECT,
        isActive: true,
        id: currentId ? { not: currentId } : undefined,
      },
    });

    if (existing) {
      throw new ConflictException({
        errorKey: 'SUBJECT_TEACHER_ALREADY_ASSIGNED',
        message: 'Mon/lop/hoc ky da co GVBM active',
      });
    }
  }

  private async ensureTeacherExists(teacherId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw this.teacherNotFound();
    }
  }

  private teacherNotFound() {
    return new NotFoundException({
      errorKey: 'TEACHER_NOT_FOUND',
      message: 'Khong tim thay giao vien',
    });
  }

  private notFound() {
    return new NotFoundException({
      errorKey: 'TEACHER_ASSIGNMENT_NOT_FOUND',
      message: 'Khong tim thay phan cong giao vien',
    });
  }
}
