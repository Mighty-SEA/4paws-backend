import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingItemRole } from '@prisma/client';

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
          pets: { include: { pet: true, examinations: { include: { doctor: true, paravet: true, admin: true, groomer: true } } } },
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
        items: { include: { serviceType: { include: { service: true } } } },
        pets: {
          include: {
            pet: true,
            examinations: { include: { productUsages: true, doctor: true, paravet: true, admin: true, groomer: true }, orderBy: { createdAt: 'desc' } },
            visits: {
              orderBy: { visitDate: 'desc' },
              include: {
                productUsages: true,
                mixUsages: { include: { mixProduct: { include: { components: { include: { product: true } } } } } },
                doctor: true,
                paravet: true,
                admin: true,
                groomer: true,
              },
            },
            mixUsages: { include: { mixProduct: { include: { components: { include: { product: true } } } } } },
          },
        },
      },
    });
  }

  planAdmission(id: number) {
    return this.prisma.booking.update({ where: { id }, data: { proceedToAdmission: true, status: 'WAITING_TO_DEPOSIT' as any } });
  }

  async splitBooking(id: number, petIds: number[]) {
    if (!Array.isArray(petIds) || petIds.length === 0) {
      throw new Error('petIds must be a non-empty array');
    }
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.booking.findUnique({ where: { id }, include: { pets: true } });
      if (!original) throw new Error('Booking not found');
      const originalPetIds = new Set(original.pets.map((bp) => bp.petId));
      for (const pid of petIds) {
        if (!originalPetIds.has(pid)) {
          throw new Error('One or more petIds do not belong to this booking');
        }
      }
      // Create new booking with same owner/service/dates
      const newBooking = await tx.booking.create({
        data: {
          ownerId: original.ownerId,
          serviceTypeId: original.serviceTypeId,
          startDate: original.startDate ?? undefined,
          endDate: original.endDate ?? undefined,
        },
      });
      // Move selected pets to new booking
      await tx.bookingPet.updateMany({
        where: { bookingId: id, petId: { in: petIds } },
        data: { bookingId: newBooking.id },
      });
      return newBooking;
    });
  }

  // Booking Items (Addon)
  async addItem(bookingId: number, dto: { serviceTypeId: number; role?: BookingItemRole; quantity?: number; startDate?: string; endDate?: string; unitPrice?: number }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    return this.prisma.bookingItem.create({
      data: {
        bookingId,
        serviceTypeId: dto.serviceTypeId,
        role: dto.role ?? 'ADDON',
        quantity: dto.quantity ?? 1,
        startDate,
        endDate,
        unitPrice: dto.unitPrice != null ? dto.unitPrice.toString() : undefined,
      },
    });
  }

  async updateItem(bookingId: number, itemId: number, dto: { serviceTypeId?: number; role?: BookingItemRole; quantity?: number; startDate?: string; endDate?: string; unitPrice?: number }) {
    const item = await this.prisma.bookingItem.findFirst({ where: { id: itemId, bookingId } });
    if (!item) throw new NotFoundException('Item not found');
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    return this.prisma.bookingItem.update({
      where: { id: itemId },
      data: {
        serviceTypeId: dto.serviceTypeId ?? undefined,
        role: dto.role ?? undefined,
        quantity: dto.quantity ?? undefined,
        startDate,
        endDate,
        unitPrice: dto.unitPrice != null ? dto.unitPrice.toString() : undefined,
      },
    });
  }

  async deleteItem(bookingId: number, itemId: number) {
    const item = await this.prisma.bookingItem.findFirst({ where: { id: itemId, bookingId } });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.bookingItem.delete({ where: { id: itemId } });
    return { ok: true };
  }
}


