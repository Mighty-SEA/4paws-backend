import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: number, bookingPetId: number, dto: { visitDate?: string; weight?: string; temperature?: string; notes?: string }) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { serviceType: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    // Allow visits only for per-day services (pricePerDay not null)
    if (!booking.serviceType.pricePerDay) {
      throw new BadRequestException('Visits hanya diperbolehkan untuk layanan per-hari');
    }
    // Optional guard: only when booking in progress (proxy for after-deposit)
    if (booking.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Visits hanya dapat dibuat ketika booking dalam status IN_PROGRESS');
    }
    return this.prisma.visit.create({
      data: {
        bookingPetId: bp.id,
        visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
        weight: dto.weight ? dto.weight : undefined,
        temperature: dto.temperature ? dto.temperature : undefined,
        notes: dto.notes,
      },
    });
  }
}



