import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  userId: number | null;
  action: string;
  entityType: string;
  entityId?: number;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValue: entry.oldValue !== undefined ? JSON.stringify(entry.oldValue) : null,
        newValue: entry.newValue !== undefined ? JSON.stringify(entry.newValue) : null,
        ipAddress: entry.ipAddress,
      },
    });
  }
}
