import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DraftsService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: number, scope: string) {
    return this.prisma.draft.findUnique({ where: { userId_scope: { userId, scope } } });
  }

  async upsert(userId: number, scope: string, data: any) {
    const draft = await this.prisma.draft.upsert({
      where: { userId_scope: { userId, scope } },
      create: { userId, scope, data },
      update: { data },
    });
    return draft;
  }

  async remove(userId: number, scope: string) {
    await this.prisma.draft.delete({ where: { userId_scope: { userId, scope } } }).catch(() => null);
    return { ok: true };
  }
}


