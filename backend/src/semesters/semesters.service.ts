import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.semester.findMany({
      orderBy: [{ schoolYearId: 'desc' }, { startDate: 'asc' }],
      include: {
        schoolYear: true,
        _count: {
          select: { enrollments: true, assignments: true, scoreSheets: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        schoolYear: true,
        _count: {
          select: { enrollments: true, assignments: true, scoreSheets: true },
        },
      },
    });
    if (!semester) {
      throw new NotFoundException('Không tìm thấy học kỳ');
    }
    return semester;
  }

  async create(dto: CreateSemesterDto) {
    this.validateDates(dto.startDate, dto.endDate);
    await this.ensureSchoolYear(dto.schoolYearId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isActive) {
          await tx.semester.updateMany({
            where: { schoolYearId: dto.schoolYearId },
            data: { isActive: false },
          });
        }

        return tx.semester.create({
          data: {
            name: dto.name,
            schoolYearId: dto.schoolYearId,
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

  async update(id: number, dto: UpdateSemesterDto) {
    const current = await this.findOne(id);
    const schoolYearId = dto.schoolYearId ?? current.schoolYearId;
    if (dto.schoolYearId) {
      await this.ensureSchoolYear(dto.schoolYearId);
    }

    const startDate = dto.startDate ?? current.startDate.toISOString();
    const endDate = dto.endDate ?? current.endDate.toISOString();
    this.validateDates(startDate, endDate);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isActive) {
          await tx.semester.updateMany({
            where: { schoolYearId, id: { not: id } },
            data: { isActive: false },
          });
        }

        return tx.semester.update({
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

  private validateDates(startDate: string, endDate: string) {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }
  }

  private async ensureSchoolYear(id: number) {
    const exists = await this.prisma.schoolYear.findUnique({ where: { id } });
    if (!exists) {
      throw new BadRequestException('Năm học không tồn tại');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Học kỳ đã tồn tại trong năm học');
    }
    throw error;
  }
}
