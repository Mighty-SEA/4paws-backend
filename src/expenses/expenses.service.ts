import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { start?: string; end?: string; category?: string }) {
    const { start, end, category } = params;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.prisma.expense.findMany({
      where: {
        AND: [
          startDate ? { expenseDate: { gte: startDate } } : {},
          endDate ? { expenseDate: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } } : {},
          category ? { category: { contains: category, mode: 'insensitive' } } : {},
        ],
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async create(dto: { expenseDate?: string; category: string; description?: string; amount: string }) {
    const expenseDate = dto.expenseDate ? new Date(dto.expenseDate) : undefined;
    return this.prisma.expense.create({
      data: {
        expenseDate,
        category: dto.category,
        description: dto.description ?? null,
        amount: dto.amount as any,
      },
    });
  }
}


