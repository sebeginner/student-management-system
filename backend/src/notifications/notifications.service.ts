import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Xây where condition theo role người xem ─────────────────
  private async buildWhereForUser(
    userId: number,
    roleName: string,
  ): Promise<Prisma.NotificationWhereInput> {
    if (roleName === 'STUDENT') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { studentId: true },
      });
      const classIds: number[] = [];
      if (user?.studentId) {
        const enrollments = await this.prisma.studentClassEnrollment.findMany({
          where: { studentId: user.studentId, status: 'ACTIVE' },
          select: { classId: true },
        });
        classIds.push(...enrollments.map((e) => e.classId));
      }
      return {
        OR: [
          // Toàn trường hoặc đúng role, không gắn lớp
          { classId: null, OR: [{ targetRole: null }, { targetRole: roleName }] },
          // Gắn lớp mà học sinh đang theo học
          ...(classIds.length > 0
            ? [{ classId: { in: classIds }, OR: [{ targetRole: null }, { targetRole: 'STUDENT' }] }]
            : []),
        ],
      };
    }

    if (roleName === 'TEACHER') {
      const assignments = await this.prisma.teacherAssignment.findMany({
        where: { teacher: { user: { id: userId } }, isActive: true },
        select: { classId: true },
      });
      const classIds = [...new Set(assignments.map((a) => a.classId))];
      return {
        OR: [
          { classId: null, OR: [{ targetRole: null }, { targetRole: roleName }] },
          ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
        ],
      };
    }

    // ADMIN, ACADEMIC_STAFF, MANAGER — thấy thông báo không gắn lớp
    return {
      classId: null,
      OR: [{ targetRole: null }, { targetRole: roleName }],
    };
  }

  async findForUser(userId: number, roleName: string) {
    const where = await this.buildWhereForUser(userId, roleName);
    const notifications = await this.prisma.notification.findMany({
      where,
      include: {
        createdBy: { select: { fullName: true } },
        reads: { where: { userId }, select: { readAt: true } },
        class: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      targetRole: n.targetRole,
      className: n.class?.name ?? null,
      createdBy: n.createdBy.fullName,
      createdAt: n.createdAt,
      isRead: n.reads.length > 0,
    }));
  }

  async getUnreadCount(userId: number, roleName: string): Promise<number> {
    const where = await this.buildWhereForUser(userId, roleName);
    const [total, read] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notificationRead.count({
        where: { userId, notification: where },
      }),
    ]);
    return total - read;
  }

  // ── Lấy danh sách lớp giáo viên được phép gửi thông báo ─────
  async getTeacherClasses(userId: number) {
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacher: { user: { id: userId } }, isActive: true },
      select: {
        classId: true,
        assignmentType: true,
        class: { select: { id: true, name: true, classCode: true } },
      },
      orderBy: { classId: 'asc' },
    });

    // Deduplicate theo classId
    const seen = new Set<number>();
    return assignments
      .filter((a) => {
        if (seen.has(a.classId)) return false;
        seen.add(a.classId);
        return true;
      })
      .map((a) => ({
        id: a.class.id,
        name: a.class.name,
        classCode: a.class.classCode,
        type: a.assignmentType, // HOMEROOM hoặc SUBJECT
      }));
  }

  async create(
    dto: CreateNotificationDto,
    creatorId: number,
    userRole: string,
  ) {
    if (userRole === 'TEACHER') {
      if (!dto.classId) {
        throw new BadRequestException(
          'Giáo viên phải chọn lớp khi gửi thông báo.',
        );
      }
      // Kiểm tra giáo viên có được phân công đến lớp này không
      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacher: { user: { id: creatorId } },
          classId: dto.classId,
          isActive: true,
        },
      });
      if (!assignment) {
        throw new ForbiddenException(
          'Bạn không được phân công đến lớp này.',
        );
      }
      return this.prisma.notification.create({
        data: {
          title: dto.title,
          content: dto.content,
          targetRole: 'STUDENT', // Giáo viên chỉ gửi đến học sinh
          classId: dto.classId,
          createdById: creatorId,
        },
      });
    }

    // ADMIN, ACADEMIC_STAFF, MANAGER — không bị ràng buộc lớp
    return this.prisma.notification.create({
      data: {
        title: dto.title,
        content: dto.content,
        targetRole: dto.targetRole ?? null,
        classId: dto.classId ?? null,
        createdById: creatorId,
      },
    });
  }

  async markRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Không tìm thấy thông báo');

    await this.prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: {},
      create: { notificationId, userId },
    });
    return { message: 'Đã đánh dấu đã đọc' };
  }

  findAll() {
    return this.prisma.notification.findMany({
      include: {
        createdBy: { select: { fullName: true } },
        class: { select: { name: true } },
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Không tìm thấy thông báo');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Đã xoá thông báo' };
  }
}
