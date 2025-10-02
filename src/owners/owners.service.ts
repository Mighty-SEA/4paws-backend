import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOwnerDto, CreatePetDto } from './dto';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOwners(params: { q?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
    const insensitive: Prisma.QueryMode = 'insensitive';
    const where: Prisma.OwnerWhereInput = params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: insensitive } },
            { phone: { contains: params.q, mode: insensitive } },
            { address: { contains: params.q, mode: insensitive } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.owner.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { _count: { select: { pets: true } } },
      }),
      this.prisma.owner.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async createOwner(dto: CreateOwnerDto) {
    return this.prisma.owner.create({ data: dto });
  }

  updateOwner(id: number, dto: Partial<{ name: string; phone: string; email?: string; address: string }>) {
    const data: any = {};
    if (dto.name !== undefined) data.name = String(dto.name);
    if (dto.phone !== undefined) data.phone = String(dto.phone);
    if (dto.email !== undefined) data.email = dto.email == null ? null : String(dto.email);
    if (dto.address !== undefined) data.address = String(dto.address);
    return this.prisma.owner.update({ where: { id }, data });
  }

  async deleteOwner(id: number) {
    // FORCE DELETE: remove all related data (bookings, bookingPets, exams, visits, usages, etc.)
    return this.prisma.$transaction(async (tx) => {
      // Collect all bookings for this owner
      const bookings = await tx.booking.findMany({ where: { ownerId: id }, select: { id: true } });
      const bookingIds = bookings.map((b) => b.id);

      if (bookingIds.length) {
        // Collect bookingPet ids for those bookings
        const bookingPets = await tx.bookingPet.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } });
        const bookingPetIds = bookingPets.map((bp) => bp.id);

        if (bookingPetIds.length) {
          const examinations = await tx.examination.findMany({ where: { bookingPetId: { in: bookingPetIds } }, select: { id: true } });
          const visits = await tx.visit.findMany({ where: { bookingPetId: { in: bookingPetIds } }, select: { id: true } });
          const examIds = examinations.map((e) => e.id);
          const visitIds = visits.map((v) => v.id);

          if (examIds.length) {
            await tx.productUsage.deleteMany({ where: { examinationId: { in: examIds } } });
          }
          if (visitIds.length) {
            await tx.productUsage.deleteMany({ where: { visitId: { in: visitIds } } });
          }

          await tx.visit.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
          await tx.mixUsage.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
          await tx.dailyCharge.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
          await tx.examination.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
          await tx.bookingPet.deleteMany({ where: { id: { in: bookingPetIds } } });
        }

        // Delete booking-level records
        await tx.bookingItem.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.deposit.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      // Delete pets owned by this owner (if any remain not referenced by bookingPets after above removals)
      await tx.pet.deleteMany({ where: { ownerId: id } });

      // Finally, delete owner
      await tx.owner.delete({ where: { id } });
      return { ok: true };
    });
  }

  async listPets(params: { q?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
    const insensitive: Prisma.QueryMode = 'insensitive';
    const where: Prisma.PetWhereInput = params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: insensitive } },
            { species: { contains: params.q, mode: insensitive } },
            { breed: { contains: params.q, mode: insensitive } },
            { owner: { name: { contains: params.q, mode: insensitive } } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pet.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { owner: true },
      }),
      this.prisma.pet.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async createPetForOwner(dto: CreatePetDto) {
    // validate owner exists
    const owner = await this.prisma.owner.findUnique({ where: { id: dto.ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');
    return this.prisma.pet.create({
      data: {
        ownerId: dto.ownerId,
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        birthdate: new Date(dto.birthdate),
      },
    });
  }

  updatePet(petId: number, dto: Partial<{ name: string; species: string; breed: string; birthdate: string }>) {
    const data: any = {};
    if (dto.name !== undefined) data.name = String(dto.name);
    if (dto.species !== undefined) data.species = String(dto.species);
    if (dto.breed !== undefined) data.breed = String(dto.breed);
    if (dto.birthdate !== undefined) data.birthdate = new Date(dto.birthdate);
    return this.prisma.pet.update({ where: { id: petId }, data });
  }

  async deletePet(petId: number) {
    // FORCE DELETE PET and its medical records/visits/usages
    return this.prisma.$transaction(async (tx) => {
      const bookingPets = await tx.bookingPet.findMany({ where: { petId }, select: { id: true } });
      const bookingPetIds = bookingPets.map((bp) => bp.id);
      if (bookingPetIds.length) {
        const examinations = await tx.examination.findMany({ where: { bookingPetId: { in: bookingPetIds } }, select: { id: true } });
        const visits = await tx.visit.findMany({ where: { bookingPetId: { in: bookingPetIds } }, select: { id: true } });
        const examIds = examinations.map((e) => e.id);
        const visitIds = visits.map((v) => v.id);

        if (examIds.length) {
          await tx.productUsage.deleteMany({ where: { examinationId: { in: examIds } } });
        }
        if (visitIds.length) {
          await tx.productUsage.deleteMany({ where: { visitId: { in: visitIds } } });
        }
        await tx.visit.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.mixUsage.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.dailyCharge.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.examination.deleteMany({ where: { bookingPetId: { in: bookingPetIds } } });
        await tx.bookingPet.deleteMany({ where: { id: { in: bookingPetIds } } });
      }

      await tx.pet.delete({ where: { id: petId } });
      return { ok: true };
    });
  }

  async getOwnerDetail(id: number) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { pets: true },
    });
    if (!owner) throw new NotFoundException('Owner not found');
    return owner;
  }

  async getPetMedicalRecords(petId: number) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId }, include: { owner: true } });
    if (!pet) throw new NotFoundException('Pet not found');
    const records = await this.prisma.bookingPet.findMany({
      where: { petId },
      include: {
        booking: { include: { serviceType: { include: { service: true } }, items: { include: { serviceType: { include: { service: true } } } } } },
        examinations: {
          include: { productUsages: true, doctor: true, paravet: true, admin: true, groomer: true },
          orderBy: { createdAt: 'desc' },
        },
        visits: {
          include: {
            productUsages: true,
            mixUsages: {
              include: {
                mixProduct: {
                  include: {
                    components: { include: { product: true } },
                  },
                },
              },
            },
            doctor: true,
            paravet: true,
            admin: true,
            groomer: true,
          },
          orderBy: { visitDate: 'desc' },
        },
        // Standalone (booking-pet level) usages not tied to a visit/exam
        productUsages: true,
        mixUsages: { include: { mixProduct: { include: { components: { include: { product: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { pet, records };
  }
}


