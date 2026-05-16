import { Injectable } from '@nestjs/common';
import { PermissionScopeService } from './permission-scope.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorizationService extends PermissionScopeService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
