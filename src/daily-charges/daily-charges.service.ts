import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyChargesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: number, bookingPetId: number, dto: { amount: string; description?: string; chargeDate?: string }) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId }, include: { booking: { include: { serviceType: true } } } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    if (!bp.booking.serviceType.pricePerDay) throw new BadRequestException('Daily charge hanya untuk layanan per-hari');
    if (bp.booking.status !== 'IN_PROGRESS') throw new BadRequestException('Daily charge hanya dapat dibuat saat IN_PROGRESS');
    return this.prisma.dailyCharge.create({
      data: {
        bookingPetId: bp.id,
        amount: dto.amount,
        description: dto.description,
        chargeDate: dto.chargeDate ? new Date(dto.chargeDate) : undefined,
      },
    });
  }

  list(_bookingId: number, bookingPetId: number) {
    return this.prisma.dailyCharge.findMany({ where: { bookingPetId }, orderBy: { chargeDate: 'desc' } });
  }

  async generateToday(bookingId: number, bookingPetId: number) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId }, include: { booking: { include: { serviceType: true } } } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    if (!bp.booking.serviceType.pricePerDay) throw new BadRequestException('Daily charge hanya untuk layanan per-hari');
    if (bp.booking.status !== 'IN_PROGRESS') throw new BadRequestException('Daily charge hanya dapat dibuat saat IN_PROGRESS');

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const existing = await this.prisma.dailyCharge.findFirst({
      where: {
        bookingPetId: bp.id,
        chargeDate: { gte: start, lte: end },
      },
    });
    if (existing) return existing;

    return this.prisma.dailyCharge.create({
      data: {
        bookingPetId: bp.id,
        amount: bp.booking.serviceType.pricePerDay.toString(),
        description: 'Auto daily charge (today)',
        chargeDate: now,
      },
    });
  }
}


