import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

// Select excludes passwordHash to prevent accidental exposure via the HTTP API.
const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  status: true,
  lastLoginAt: true,
  roleId: true,
  studentId: true,
  teacherId: true,
  role: true,
  student: {
    select: { id: true, studentCode: true, fullName: true },
  },
  teacher: {
    select: { id: true, teacherCode: true, fullName: true },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findAll(query: UserQueryDto) {
    const where: Prisma.UserWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { username: { contains: query.keyword, mode: 'insensitive' } },
        { fullName: { contains: query.keyword, mode: 'insensitive' } },
        { email: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.roleName) {
      where.role = { name: query.roleName };
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async create(dto: CreateUserDto) {
    const role = await this.prisma.role.findUnique({
      where: { name: dto.roleName },
    });
    if (!role) throw new NotFoundException('Vai trò không tồn tại');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          roleId: role.id,
          studentId: dto.studentId ?? null,
          teacherId: dto.teacherId ?? null,
          status: 'ACTIVE',
        },
        select: USER_SELECT,
      });
    } catch (error: unknown) {
      return this.handleUniqueConflict(error);
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    let roleId: number | undefined;
    if (dto.roleName) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.roleName },
      });
      if (!role) throw new NotFoundException('Vai trò không tồn tại');
      roleId = role.id;
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          status: dto.status,
          roleId,
          studentId: dto.studentId,
          teacherId: dto.teacherId,
        },
        select: USER_SELECT,
      });
    } catch (error: unknown) {
      return this.handleUniqueConflict(error);
    }
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: USER_SELECT,
    });
  }

  private handleUniqueConflict(error: unknown): never {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError?.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] ?? 'field';
      throw new ConflictException(`${field} đã tồn tại trong hệ thống`);
    }
    throw error as Error;
  }
}
