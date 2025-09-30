import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { AllowRoles } from '../auth/roles.decorator';
import * as bcrypt from 'bcryptjs';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(Number(id));
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Post()
  async create(
    @Body()
    body: { username: string; password: string; accountRole: string; staffId: number },
  ) {
    const passwordHash = await bcrypt.hash(String(body.password), 10);
    return this.users.create({ username: body.username, passwordHash, accountRole: body.accountRole as any, staffId: Number(body.staffId) });
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ password?: string; accountRole?: string }>,
  ) {
    const data: any = {};
    if (body.password !== undefined) {
      data.passwordHash = await bcrypt.hash(String(body.password), 10);
    }
    if (body.accountRole !== undefined) data.accountRole = body.accountRole as any;
    return this.users.update(Number(id), data);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.users.delete(Number(id));
  }
}


