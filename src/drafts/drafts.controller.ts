import { Body, Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DraftsService } from './drafts.service';

@UseGuards(AuthGuard('jwt'))
@Controller('drafts')
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  async get(@Req() req: any, @Query('scope') scope = 'generic') {
    const userId = Number(req.user?.userId);
    const data = await this.drafts.get(userId, scope);
    return data ?? {};
  }

  @Post()
  async upsert(@Req() req: any, @Body() body: { scope: string; data: any }) {
    const userId = Number(req.user?.userId);
    const scope = String(body.scope || 'generic');
    return this.drafts.upsert(userId, scope, body.data ?? {});
  }

  @Delete()
  async remove(@Req() req: any, @Query('scope') scope = 'generic') {
    const userId = Number(req.user?.userId);
    return this.drafts.remove(userId, scope);
  }
}


