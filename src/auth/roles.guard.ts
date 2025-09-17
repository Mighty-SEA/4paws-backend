import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

export type AllowedAccountRole = 'MASTER' | 'SUPERVISOR';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowed: AllowedAccountRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const accountRole: AllowedAccountRole | undefined = req.user?.accountRole;
    if (!accountRole) throw new ForbiddenException('Unauthorized');
    if (this.allowed.includes(accountRole)) return true;
    throw new ForbiddenException('Insufficient role');
  }
}
