import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto, UpdateBankAccountDto, UpdateStoreSettingDto, CreatePetSpeciesDto, UpdatePetSpeciesDto } from './dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreSetting() {
    const setting = await this.prisma.storeSetting.findFirst({
      include: { bankAccounts: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
      orderBy: { id: 'asc' },
    });
    return setting ?? null;
  }

  async upsertStoreSetting(dto: UpdateStoreSettingDto) {
    const existing = await this.prisma.storeSetting.findFirst({ orderBy: { id: 'asc' } });
    if (existing) {
      return this.prisma.storeSetting.update({
        where: { id: existing.id },
        data: {
          name: dto.name ?? undefined,
          address: dto.address ?? undefined,
          phone: dto.phone ?? undefined,
          extra: (dto.extra as any) ?? undefined,
        },
      });
    }
    return this.prisma.storeSetting.create({ data: { address: dto.address ?? '', phone: dto.phone ?? '', name: dto.name ?? null, extra: (dto.extra as any) ?? null } });
  }

  async createBankAccount(dto: CreateBankAccountDto) {
    let setting = await this.prisma.storeSetting.findFirst({ orderBy: { id: 'asc' } });
    if (!setting) {
      setting = await this.prisma.storeSetting.create({ data: { address: '', phone: '' } });
    }

    return this.prisma.$transaction(async (tx) => {
      return tx.bankAccount.create({
        data: {
          storeSettingId: setting.id,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountHolder: dto.accountHolder,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    });
  }

  async updateBankAccount(id: number, dto: UpdateBankAccountDto) {
    const acc = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!acc) throw new NotFoundException('Bank account not found');
    return this.prisma.$transaction(async (tx) => {
      return tx.bankAccount.update({
        where: { id },
        data: {
          bankName: dto.bankName ?? undefined,
          accountNumber: dto.accountNumber ?? undefined,
          accountHolder: dto.accountHolder ?? undefined,
          isActive: dto.isActive ?? undefined,
          sortOrder: dto.sortOrder ?? undefined,
        },
      });
    });
  }

  async deleteBankAccount(id: number) {
    return this.prisma.bankAccount.delete({ where: { id } });
  }

  // Pet Species CRUD
  async listPetSpecies() {
    return this.prisma.petSpecies.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  }

  async createPetSpecies(dto: CreatePetSpeciesDto) {
    return this.prisma.petSpecies.create({
      data: {
        kind: dto.kind,
        name: dto.name,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updatePetSpecies(id: number, dto: UpdatePetSpeciesDto) {
    return this.prisma.petSpecies.update({
      where: { id },
      data: {
        kind: dto.kind ?? undefined,
        name: dto.name ?? undefined,
        isActive: dto.isActive ?? undefined,
        sortOrder: dto.sortOrder ?? undefined,
      },
    });
  }

  async deletePetSpecies(id: number) {
    return this.prisma.petSpecies.delete({ where: { id } });
  }
}


