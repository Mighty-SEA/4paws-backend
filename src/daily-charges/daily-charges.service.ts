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

  private normalizeDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async generateRange(bookingId: number, bookingPetId: number, startIso?: string, endIso?: string) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId }, include: { booking: { include: { serviceType: true } } } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    if (!bp.booking.serviceType.pricePerDay) throw new BadRequestException('Daily charge hanya untuk layanan per-hari');
    if (bp.booking.status !== 'IN_PROGRESS') throw new BadRequestException('Daily charge hanya dapat dibuat saat IN_PROGRESS');

    const start = startIso ? this.normalizeDay(new Date(startIso)) : this.normalizeDay(new Date());
    const end = endIso ? this.normalizeDay(new Date(endIso)) : this.normalizeDay(new Date());
    if (end.getTime() < start.getTime()) throw new BadRequestException('End before start');

    const amount = bp.booking.serviceType.pricePerDay.toString();
    const created: any[] = [];
    for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
      const dayStart = this.normalizeDay(d);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const exists = await this.prisma.dailyCharge.findFirst({ where: { bookingPetId: bp.id, chargeDate: { gte: dayStart, lte: dayEnd } } });
      if (exists) continue;
      const dc = await this.prisma.dailyCharge.create({
        data: { bookingPetId: bp.id, amount, description: 'Auto daily charge (range)', chargeDate: new Date(dayStart) },
      });
      created.push(dc);
    }
    return { ok: true, createdCount: created.length };
  }

  async generateUntilCheckout(bookingId: number, bookingPetId: number) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId }, include: { booking: { include: { serviceType: true } } } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    if (!bp.booking.serviceType.pricePerDay) throw new BadRequestException('Daily charge hanya untuk layanan per-hari');

    // Determine end date: prefer booking.endDate, else today
    const endDate = bp.booking.endDate ? this.normalizeDay(new Date(bp.booking.endDate)) : this.normalizeDay(new Date());
    // Determine start: last charged day + 1 or booking.startDate
    const last = await this.prisma.dailyCharge.findFirst({ where: { bookingPetId: bp.id }, orderBy: { chargeDate: 'desc' } });
    const startDate = last ? this.normalizeDay(new Date(last.chargeDate)) : (bp.booking.startDate ? this.normalizeDay(new Date(bp.booking.startDate)) : this.normalizeDay(new Date()));
    const startNext = new Date(startDate);
    startNext.setDate(startNext.getDate() + 1);
    return this.generateRange(bookingId, bookingPetId, startNext.toISOString(), endDate.toISOString());
  }
}


