import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../auth/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_ALIASES: Record<string, string> = {
  GIAOVU: 'ACADEMIC_STAFF',
  BGH: 'MANAGER',
};

function normalizeRole(role: string) {
  const normalized = role.trim().toUpperCase();
  return ROLE_ALIASES[normalized] ?? normalized;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const userRole = request.user?.role;
    if (!userRole) {
      return false;
    }

    const allowedRoles = roles.map(normalizeRole);
    return allowedRoles.includes(normalizeRole(userRole));
  }
}
