import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';

@Injectable()
export class GradeLevelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.gradeLevel.findMany({
      orderBy: { level: 'asc' },
      include: { _count: { select: { classes: true } } },
    });
  }

  async findOne(id: number) {
    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { id },
      include: {
        classes: { orderBy: { name: 'asc' } },
        _count: { select: { classes: true } },
      },
    });
    if (!gradeLevel) {
      throw new NotFoundException('Không tìm thấy khối lớp');
    }
    return gradeLevel;
  }

  async create(dto: CreateGradeLevelDto) {
    try {
      return await this.prisma.gradeLevel.create({
        data: { ...dto, isActive: dto.isActive ?? true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateGradeLevelDto) {
    await this.findOne(id);
    try {
      return await this.prisma.gradeLevel.update({ where: { id }, data: dto });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Khối lớp đã tồn tại');
    }
    throw error;
  }
}
