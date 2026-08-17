import { CanActivate, ExecutionContext, Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PG_POOL) private readonly db: Pool,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (!userId) return false;

    const result = await this.db.query(
      `select r.key from user_roles ur join roles r on r.id = ur.role_id
       where ur.user_id = $1 and ur.scope_type = 'platform' and r.key = any($2)`,
      [userId, requiredRoles],
    );
    if (!result.rowCount) throw new ForbiddenException(`Requires one of: ${requiredRoles.join(', ')}`);
    return true;
  }
}
