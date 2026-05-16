import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.schoolYear.findMany({
      orderBy: [{ isActive: 'desc' }, { startYear: 'desc' }],
      include: {
        _count: {
          select: { semesters: true, classes: true, assignments: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const academicYear = await this.prisma.schoolYear.findUnique({
      where: { id },
      include: {
        semesters: { orderBy: { startDate: 'asc' } },
        _count: {
          select: { classes: true, assignments: true, systemParams: true },
        },
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Không tìm thấy năm học');
    }

    return academicYear;
  }

  async create(dto: CreateAcademicYearDto) {
    this.validateRange(dto);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isActive) {
          await tx.schoolYear.updateMany({ data: { isActive: false } });
        }

        return tx.schoolYear.create({
          data: {
            name: dto.name,
            startYear: dto.startYear,
            endYear: dto.endYear,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            isActive: dto.isActive ?? false,
          },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateAcademicYearDto) {
    await this.findOne(id);
    this.validateRange(dto);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isActive) {
          await tx.schoolYear.updateMany({
            where: { id: { not: id } },
            data: { isActive: false },
          });
        }

        return tx.schoolYear.update({
          where: { id },
          data: {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private validateRange(dto: Partial<CreateAcademicYearDto>) {
    if (
      dto.startYear !== undefined &&
      dto.endYear !== undefined &&
      dto.startYear >= dto.endYear
    ) {
      throw new BadRequestException('Năm bắt đầu phải nhỏ hơn năm kết thúc');
    }

    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.startDate) >= new Date(dto.endDate)
    ) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Năm học đã tồn tại');
    }
    throw error;
  }
}
