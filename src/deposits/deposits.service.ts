import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepositsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: number, dto: { amount: string; method?: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { serviceType: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.serviceType.pricePerDay) {
      throw new BadRequestException('Deposit hanya untuk layanan per-hari');
    }
    const dep = await this.prisma.deposit.create({
      data: { bookingId, amount: dto.amount, method: dto.method },
    });
    // Set status IN_PROGRESS bila masih PENDING
    if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
      await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'IN_PROGRESS' } });
    }
    return dep;
  }

  list(bookingId: number) {
    return this.prisma.deposit.findMany({ where: { bookingId }, orderBy: { depositDate: 'desc' } });
  }
}


