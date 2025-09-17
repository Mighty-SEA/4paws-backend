import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { AuthGuard } from '@nestjs/passport';
import { AllowRoles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list() {
    return this.staff.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.staff.get(Number(id));
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Post()
  create(@Req() req: any, @Body() body: { name: string; jobRole: string }) {
    const userId = Number(req.user?.userId);
    return this.staff.create({ userId, name: String(body.name), jobRole: body.jobRole as any });
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; jobRole: string }>) {
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.jobRole !== undefined) data.jobRole = body.jobRole as any;
    return this.staff.update(Number(id), data);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.staff.delete(Number(id));
  }
}


