import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

export type AllowedAccountRole = 'MASTER' | 'SUPERVISOR';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly _allowed: AllowedAccountRole[]) {}

  canActivate(_context: ExecutionContext): boolean {
    // Temporarily allow all roles (disable RBAC)
    return true;
  }
}
