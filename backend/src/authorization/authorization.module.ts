import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationService } from './authorization.service';
import { PermissionScopeService } from './permission-scope.service';

@Module({
  imports: [PrismaModule],
  providers: [AuthorizationService, PermissionScopeService],
  exports: [AuthorizationService, PermissionScopeService],
})
export class AuthorizationModule {}
