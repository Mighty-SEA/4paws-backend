import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

export type AllowedAccountRole = 'MASTER' | 'SUPERVISOR';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly _allowed: AllowedAccountRole[]) {}

  canActivate(_context: ExecutionContext): boolean {
    const req = _context.switchToHttp().getRequest();
    const user = req?.user as { accountRole?: AllowedAccountRole } | undefined;
    if (!user?.accountRole) return false;
    if (!this._allowed?.length) return true;
    return this._allowed.includes(user.accountRole);
  }
}
