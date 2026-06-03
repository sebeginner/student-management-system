import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto) {
    const page  = Math.max(1, query.page  ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip  = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId)   where.entityId   = query.entityId;
    if (query.userId)     where.userId      = query.userId;
    if (query.action)     where.action      = { contains: query.action, mode: 'insensitive' };

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to)   where.createdAt.lte = new Date(query.to);
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }
}
