import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherQueryDto } from './dto/teacher-query.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

const TEACHER_INCLUDE = {
  subject: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
    },
  },
  _count: {
    select: {
      assignments: true,
    },
  },
};

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TeacherQueryDto, user: AuthenticatedUser) {
    const where = this.buildWhere(query, user);

    return this.prisma.teacher.findMany({
      where,
      include: TEACHER_INCLUDE,
      orderBy: { teacherCode: 'asc' },
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        ...this.teacherScope(user),
      },
      include: TEACHER_INCLUDE,
    });

    if (!teacher) {
      throw this.notFound();
    }

    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    try {
      return await this.prisma.teacher.create({
        data: {
          teacherCode: dto.teacherCode,
          fullName: dto.fullName,
          subjectId: dto.subjectId,
          email: dto.email,
          phone: dto.phone,
          status: dto.status ?? 'ACTIVE',
        },
        include: TEACHER_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateTeacherDto) {
    const current = await this.prisma.teacher.findUnique({ where: { id } });
    if (!current) {
      throw this.notFound();
    }

    try {
      return await this.prisma.teacher.update({
        where: { id },
        data: dto,
        include: TEACHER_INCLUDE,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private buildWhere(
    query: TeacherQueryDto,
    user: AuthenticatedUser,
  ): Prisma.TeacherWhereInput {
    const and: Prisma.TeacherWhereInput[] = [this.teacherScope(user)];

    if (query.keyword) {
      and.push({
        OR: [
          { teacherCode: { contains: query.keyword, mode: 'insensitive' } },
          { fullName: { contains: query.keyword, mode: 'insensitive' } },
          { email: { contains: query.keyword, mode: 'insensitive' } },
        ],
      });
    }

    if (query.subjectId) {
      and.push({ subjectId: query.subjectId });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    return { AND: and };
  }

  private teacherScope(user: AuthenticatedUser): Prisma.TeacherWhereInput {
    if (['ADMIN', 'ACADEMIC_STAFF', 'MANAGER'].includes(user.role)) {
      return {};
    }

    if (user.role === 'TEACHER') {
      if (!user.teacherId) {
        throw new ForbiddenException('Khong co ho so giao vien lien ket');
      }
      return { id: user.teacherId };
    }

    throw new ForbiddenException('Khong co quyen truy cap giao vien');
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        errorKey: 'TEACHER_CODE_EXISTS',
        message: 'Ma giao vien da ton tai',
      });
    }
    throw error;
  }

  private notFound() {
    return new NotFoundException({
      errorKey: 'TEACHER_NOT_FOUND',
      message: 'Khong tim thay giao vien',
    });
  }
}
