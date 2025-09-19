import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ include: { staff: true } });
  }

  async get(id: number) {
    const u = await this.prisma.user.findUnique({ where: { id }, include: { staff: true } });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  create(data: { username: string; passwordHash: string; accountRole: AccountRole; staffId: number }) {
    return this.prisma.user.create({ data });
  }

  update(id: number, data: Partial<{ passwordHash: string; accountRole: AccountRole }>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}


