import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { start?: string; end?: string; q?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? 20)));
    const where: any = {};
    if (params.start || params.end) {
      where.expenseDate = {};
      if (params.start) where.expenseDate.gte = new Date(params.start);
      if (params.end) where.expenseDate.lte = new Date(params.end);
    }
    if (params.q) {
      where.OR = [
        { description: { contains: String(params.q), mode: 'insensitive' } },
      ];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, total, page, pageSize };
  }

  async create(data: { expenseDate?: string | Date; description?: string; amount: number }) {
    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
    return this.prisma.expense.create({
      data: {
        expenseDate,
        description: data.description?.trim() || null,
        amount,
      },
    });
  }

  async update(id: number, data: Partial<{ expenseDate: string | Date; description: string; amount: number }>) {
    const payload: any = {};
    if (data.expenseDate !== undefined) payload.expenseDate = new Date(data.expenseDate);
    if (data.description !== undefined) payload.description = data.description?.trim() || null;
    if (data.amount !== undefined) {
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
      payload.amount = amount;
    }
    return this.prisma.expense.update({ where: { id }, data: payload });
  }

  async delete(id: number) {
    return this.prisma.expense.delete({ where: { id } });
  }
}


