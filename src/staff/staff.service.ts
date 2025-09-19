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

  async create(data: { name: string; jobRole: JobRole }) {
    // Create staff independently; linking is done from User (user.staffId)
    const { name, jobRole } = data;
    return this.prisma.staff.create({ data: { name, jobRole } });
  }

  update(id: number, data: Partial<{ name: string; jobRole: JobRole }>) {
    return this.prisma.staff.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.staff.delete({ where: { id } });
  }
}


