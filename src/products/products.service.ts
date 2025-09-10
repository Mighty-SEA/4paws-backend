import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return this.prisma.product.findMany({ orderBy: { name: 'asc' } });
  }

  createProduct(dto: { name: string; unit: string; unitContentAmount?: string; unitContentName?: string }) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        unit: dto.unit,
        unitContentAmount: dto.unitContentAmount ?? undefined,
        unitContentName: dto.unitContentName ?? undefined,
      },
    });
  }

  async addInventory(currentRole: string, dto: { productId: number; quantity: string; type: 'IN' | 'ADJUSTMENT'; note?: string }) {
    if (currentRole !== 'MANAGER') throw new ForbiddenException('Only MANAGER can add inventory');
    return this.prisma.inventory.create({ data: { productId: dto.productId, quantity: dto.quantity, type: dto.type, note: dto.note } });
  }

  async getAvailable(productId: number) {
    const entries = await this.prisma.inventory.findMany({ where: { productId } });
    // Sum IN and ADJUSTMENT as they both mutate stock count
    return entries.reduce((sum, e) => sum + Number(e.quantity), 0);
  }
}


