import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Optionally cascade delete pets via Prisma relations or handle manually
    return this.prisma.owner.delete({ where: { id } });
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

  deletePet(petId: number) {
    return this.prisma.pet.delete({ where: { id: petId } });
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
        booking: { include: { serviceType: { include: { service: true } } } },
        examinations: {
          include: { productUsages: true, doctor: true, paravet: true },
          orderBy: { createdAt: 'desc' },
        },
        visits: {
          include: { productUsages: true, mixUsages: { include: { mixProduct: true } }, doctor: true, paravet: true },
          orderBy: { visitDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { pet, records };
  }
}


