import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(bookingId: number) {
    return this.prisma.payment.findMany({ where: { bookingId }, orderBy: { paymentDate: 'desc' } });
  }

  async refund(bookingId: number, dto: { amount: string; method?: string }) {
    const amount = Number(dto.amount);
    if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');
    return this.prisma.payment.create({ data: { bookingId, total: `-${amount}`, method: dto.method ?? 'REFUND' } });
  }
}


