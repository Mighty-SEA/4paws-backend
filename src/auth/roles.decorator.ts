import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RolesGuard, AllowedAccountRole } from './roles.guard';

export const ROLES_KEY = 'allowedAccountRoles';

export function AllowRoles(...roles: AllowedAccountRole[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(new RolesGuard(roles)));
}


