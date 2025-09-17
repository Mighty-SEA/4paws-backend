import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listServices() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  listServiceTypes(serviceId?: number) {
    return this.prisma.serviceType.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: { service: true },
      orderBy: { id: 'desc' },
    });
  }

  async createServiceType(_currentRole: string, dto: { serviceId: number; name: string; price: string; pricePerDay?: string | null }) {
    return this.prisma.serviceType.create({
      data: {
        serviceId: dto.serviceId,
        name: dto.name,
        price: dto.price,
        pricePerDay: dto.pricePerDay ?? null,
      },
    });
  }

  async updateServiceType(
    _currentRole: string,
    id: number,
    dto: { name?: string; price?: string; pricePerDay?: string | null },
  ) {
    return this.prisma.serviceType.update({
      where: { id },
      data: {
        name: dto.name,
        price: dto.price,
        pricePerDay: dto.pricePerDay ?? null,
      },
    });
  }
}


