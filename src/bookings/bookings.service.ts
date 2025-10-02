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
          pets: { 
            include: { 
              pet: true, 
              examinations: { 
                include: { 
                  doctor: true, 
                  paravet: true, 
                  admin: true, 
                  groomer: true,
                  productUsages: true
                } 
              },
              visits: {
                include: {
                  productUsages: true,
                  mixUsages: { include: { mixProduct: true } }
                }
              },
              mixUsages: { 
                where: { visitId: null }, 
                include: { mixProduct: true } 
              },
              productUsages: true
            } 
          },
          deposits: true,
        },
      }),
      this.prisma.booking.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async createBooking(dto: { ownerId: number; serviceTypeId: number; petIds?: number[]; startDate?: string; endDate?: string }) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    return this.prisma.$transaction(async (tx) => {
      const st = await tx.serviceType.findUnique({ where: { id: dto.serviceTypeId }, include: { service: true } });
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
      } else if (st && st.service && st.service.name.toLowerCase() === 'petshop') {
        // Reuse a single placeholder pet per owner for Petshop transactions
        // This avoids creating many duplicate pets named "Petshop" on repeated orders
        const existingPlaceholder = await tx.pet.findFirst({
          where: {
            ownerId: dto.ownerId,
            name: 'Petshop',
            species: 'Petshop',
            breed: 'Petshop',
          },
        });
        const placeholder =
          existingPlaceholder ??
          (await tx.pet.create({
            data: {
              ownerId: dto.ownerId,
              name: 'Petshop',
              species: 'Petshop',
              breed: 'Petshop',
              birthdate: new Date(),
            },
          }));
        await tx.bookingPet.create({ data: { bookingId: booking.id, petId: placeholder.id } });
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
            examinations: {
              where: {
                OR: [
                  { weight: { not: null } },
                  { temperature: { not: null } },
                  { notes: { not: null } },
                  { chiefComplaint: { not: null } },
                  { additionalNotes: { not: null } },
                  { diagnosis: { not: null } },
                  { prognosis: { not: null } },
                  { doctorId: { not: null } },
                  { paravetId: { not: null } },
                  { adminId: { not: null } },
                  { groomerId: { not: null } },
                  { productUsages: { some: {} } },
                ],
              },
              include: { productUsages: true, doctor: true, paravet: true, admin: true, groomer: true },
              orderBy: { createdAt: 'desc' },
            },
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
            productUsages: true,
          },
        },
      },
    });
  }

  // Lightweight summary for booking detail page header
  getBookingSummary(id: number) {
    return this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        proceedToAdmission: true,
        primaryDiscountPercent: true,
        primaryDiscountAmount: true,
        owner: { select: { id: true, name: true } },
        serviceType: {
          select: {
            id: true,
            name: true,
            price: true,
            pricePerDay: true,
            service: { select: { id: true, name: true } },
          },
        },
        items: {
          select: {
            id: true,
            role: true,
            quantity: true,
            unitPrice: true,
            startDate: true,
            endDate: true,
            discountPercent: true,
            discountAmount: true,
            serviceType: {
              select: {
                id: true,
                name: true,
                price: true,
                pricePerDay: true,
                service: { select: { name: true } },
              },
            },
          },
        },
        pets: {
          select: {
            id: true,
            pet: { select: { id: true, name: true } },
            examinations: { select: { id: true } },
          },
        },
      },
    });
  }

  planAdmission(id: number) {
    return this.prisma.booking.update({ where: { id }, data: { proceedToAdmission: true, status: 'WAITING_TO_DEPOSIT' as any } });
  }

  updateBooking(id: number, dto: any) {
    const data: any = {};
    if (dto?.status) data.status = dto.status;
    if (dto?.proceedToAdmission != null) data.proceedToAdmission = Boolean(dto.proceedToAdmission);
    return this.prisma.booking.update({ where: { id }, data });
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

  async deleteBooking(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        pets: {
          include: {
            examinations: true,
            visits: true,
            dailyCharges: true,
            mixUsages: true,
            productUsages: true,
          },
        },
        items: true,
        deposits: true,
        payments: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'PENDING') {
      throw new Error('Hanya booking berstatus PENDING yang dapat dihapus');
    }

    return this.prisma.$transaction(async (tx) => {
      const bookingPetIds = booking.pets.map((p) => p.id);
      const examinationIds = booking.pets.flatMap((p) => (p.examinations ?? []).map((e) => e.id));
      const visitIds = booking.pets.flatMap((p) => (p.visits ?? []).map((v) => v.id));

      if (examinationIds.length) {
        await tx.productUsage.deleteMany({ where: { examinationId: { in: examinationIds } } });
      }
      if (visitIds.length) {
        await tx.productUsage.deleteMany({ where: { visitId: { in: visitIds } } });
      }
      if (bookingPetIds.length) {
        await tx.productUsage.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
      }
      if (bookingPetIds.length) {
        await tx.visit.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.mixUsage.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.dailyCharge.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.examination.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.bookingPet.deleteMany({ where: { id: { in: bookingPetIds } } });
      }
      await tx.bookingItem.deleteMany({ where: { bookingId: id } });
      await tx.deposit.deleteMany({ where: { bookingId: id } });
      await tx.payment.deleteMany({ where: { bookingId: id } });
      await tx.booking.delete({ where: { id } });
      return { ok: true };
    });
  }

  // Standalone Product Usages
  async addStandaloneProductUsage(
    bookingId: number,
    bookingPetId: number,
    dto: { productId?: number; productName?: string; quantity: string; unitPrice?: string },
  ) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId }, include: { booking: true } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    // Resolve product by id or name
    const product = dto.productId
      ? await this.prisma.product.findUnique({ where: { id: dto.productId } })
      : dto.productName
      ? await this.prisma.product.findFirst({ where: { name: dto.productName } })
      : null;
    if (!product) throw new NotFoundException('Product not found');

    const quantityStr = String(dto.quantity).trim();
    const unitPriceStr = dto.unitPrice != null ? String(dto.unitPrice).trim() : String(product.price);

    return this.prisma.$transaction(async (tx) => {
      const usage = await tx.productUsage.create({
        data: {
          bookingPetId: bp.id,
          productName: product.name,
          quantity: quantityStr,
          unitPrice: unitPriceStr,
        },
      });
      // Inventory OUT in primary unit
      await tx.inventory.create({ data: { productId: product.id, quantity: `-${quantityStr}` as any, type: 'OUT', note: `Standalone product usage #${usage.id}` } });
      return usage;
    });
  }

  async deleteStandaloneProductUsage(bookingId: number, bookingPetId: number, usageId: number) {
    const usage = await this.prisma.productUsage.findFirst({ where: { id: usageId, bookingPetId } });
    if (!usage) throw new NotFoundException('Product usage not found');
    const product = await this.prisma.product.findFirst({ where: { name: usage.productName } });
    return this.prisma.$transaction(async (tx) => {
      if (product) {
        await tx.inventory.create({ data: { productId: product.id, quantity: String(usage.quantity), type: 'ADJUSTMENT', note: `Revert standalone usage #${usage.id}` } });
      }
      await tx.productUsage.delete({ where: { id: usage.id } });
      return { ok: true };
    });
  }
}


