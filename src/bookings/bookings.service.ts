import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBookings(params: { page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: true,
          serviceType: { include: { service: true } },
          pets: { include: { pet: true, examinations: true } },
          deposits: true,
        },
      }),
      this.prisma.booking.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async createBooking(dto: { ownerId: number; serviceTypeId: number; petIds: number[]; startDate?: string; endDate?: string }) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          ownerId: dto.ownerId,
          serviceTypeId: dto.serviceTypeId,
          startDate,
          endDate,
        },
      });
      if (dto.petIds?.length) {
        await tx.bookingPet.createMany({
          data: dto.petIds.map((pid) => ({ bookingId: booking.id, petId: pid })),
        });
      }
      return booking;
    });
  }

  getBooking(id: number) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        owner: true,
        serviceType: { include: { service: true } },
        pets: {
          include: {
            pet: true,
            examinations: { include: { productUsages: true }, orderBy: { createdAt: 'desc' } },
            visits: {
              orderBy: { visitDate: 'desc' },
              include: {
                productUsages: true,
                mixUsages: { include: { mixProduct: true } },
              },
            },
          },
        },
      },
    });
  }
}


