import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertTimetableSlotDto } from './dto/upsert-timetable-slot.dto';

const SLOT_INCLUDE = {
  class:   { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, subjectCode: true } },
  teacher: { select: { id: true, teacherCode: true, fullName: true } },
  semester: { include: { schoolYear: true } },
} as const;

const DAY_LABELS: Record<number, string> = { 1:'Thứ 2', 2:'Thứ 3', 3:'Thứ 4', 4:'Thứ 5', 5:'Thứ 6', 6:'Thứ 7' };

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async findByClass(semesterId: number, classId: number) {
    const slots = await this.prisma.timetableSlot.findMany({
      where: { semesterId, classId, isActive: true },
      include: SLOT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });
    return this.buildGrid(slots);
  }

  async findMyTimetable(semesterId: number, user: AuthenticatedUser) {
    if (user.role === 'TEACHER') {
      if (!user.teacherId) throw new ForbiddenException('Không có hồ sơ giáo viên');
      const slots = await this.prisma.timetableSlot.findMany({
        where: { semesterId, teacherId: user.teacherId, isActive: true },
        include: SLOT_INCLUDE,
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      });
      return this.buildGrid(slots);
    }

    if (user.role === 'STUDENT') {
      if (!user.studentId) throw new ForbiddenException('Không có hồ sơ học sinh');
      // Tìm lớp đang học trong semester này
      const enrollment = await this.prisma.studentClassEnrollment.findFirst({
        where: { studentId: user.studentId, semesterId, status: 'ACTIVE' },
        select: { classId: true },
      });
      if (!enrollment) return this.buildGrid([]);

      const slots = await this.prisma.timetableSlot.findMany({
        where: { semesterId, classId: enrollment.classId, isActive: true },
        include: SLOT_INCLUDE,
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      });
      return this.buildGrid(slots);
    }

    throw new ForbiddenException('Vai trò không hỗ trợ xem TKB cá nhân');
  }

  async upsert(dto: UpsertTimetableSlotDto) {
    // Validate no teacher conflict (same teacher, same time, different class)
    const teacherConflict = await this.prisma.timetableSlot.findFirst({
      where: {
        semesterId: dto.semesterId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        period: dto.period,
        isActive: true,
        NOT: { classId: dto.classId },
      },
      include: { class: { select: { name: true } } },
    });
    if (teacherConflict) {
      throw new BadRequestException({
        errorKey: 'TEACHER_CONFLICT',
        message: `Giáo viên đã có tiết ${DAY_LABELS[dto.dayOfWeek]} tiết ${dto.period} tại lớp ${teacherConflict.class.name}`,
      });
    }

    return this.prisma.timetableSlot.upsert({
      where: {
        unique_class_slot: {
          semesterId: dto.semesterId,
          classId: dto.classId,
          dayOfWeek: dto.dayOfWeek,
          period: dto.period,
        },
      },
      update: {
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        room: dto.room,
        isActive: true,
      },
      create: {
        semesterId: dto.semesterId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        period: dto.period,
        room: dto.room,
        isActive: true,
      },
      include: SLOT_INCLUDE,
    });
  }

  async remove(id: number) {
    const slot = await this.prisma.timetableSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Không tìm thấy tiết học');

    return this.prisma.timetableSlot.update({
      where: { id },
      data: { isActive: false },
      include: SLOT_INCLUDE,
    });
  }

  async bulkUpsert(slots: UpsertTimetableSlotDto[]) {
    const results: Awaited<ReturnType<typeof this.upsert>>[] = [];
    for (const dto of slots) {
      results.push(await this.upsert(dto));
    }
    return results;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildGrid(slots: any[]) {
    const grid: Record<number, Record<number, unknown>> = {};
    for (const slot of slots) {
      if (!grid[slot.dayOfWeek]) grid[slot.dayOfWeek] = {};
      grid[slot.dayOfWeek][slot.period] = slot;
    }
    return { slots, grid };
  }
}
