import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.staff.findMany({ include: { user: true } });
  }

  async get(id: number) {
    const s = await this.prisma.staff.findUnique({ where: { id }, include: { user: true } });
    if (!s) throw new NotFoundException('Staff not found');
    return s;
  }

  async create(data: { userId: number; name: string; jobRole: JobRole }) {
    const existing = await this.prisma.staff.findUnique({ where: { userId: data.userId } });
    if (existing) {
      return this.prisma.staff.update({ where: { id: existing.id }, data: { name: data.name, jobRole: data.jobRole } });
    }
    return this.prisma.staff.create({ data });
  }

  update(id: number, data: Partial<{ name: string; jobRole: JobRole }>) {
    return this.prisma.staff.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.staff.delete({ where: { id } });
  }
}


