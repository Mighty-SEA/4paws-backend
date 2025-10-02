import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return this.prisma.product.findMany({ orderBy: { name: 'asc' } });
  }

  async listProductsWithInventory() {
    const products = await this.prisma.product.findMany({ orderBy: { name: 'asc' } });
    
    // Get all inventory data in one query instead of multiple
    const allInventory = await this.prisma.inventory.findMany({
      select: {
        productId: true,
        quantity: true,
      },
    });

    // Build availability map
    const availabilityMap = new Map<number, number>();
    for (const inv of allInventory) {
      const current = availabilityMap.get(inv.productId) ?? 0;
      availabilityMap.set(inv.productId, current + Number(inv.quantity));
    }

    // Attach availability to each product
    return products.map((product) => ({
      ...product,
      available: availabilityMap.get(product.id) ?? 0,
    }));
  }

  createProduct(dto: { name: string; unit: string; price?: string; unitContentAmount?: string; unitContentName?: string }) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        unit: dto.unit,
        price: dto.price ?? '0',
        unitContentAmount: dto.unitContentAmount ?? undefined,
        unitContentName: dto.unitContentName ?? undefined,
      },
    });
  }

  async addInventory(_currentRole: string, dto: { productId: number; quantity: string; type: 'IN' | 'ADJUSTMENT' | 'OUT'; note?: string }) {
    return this.prisma.inventory.create({ data: { productId: dto.productId, quantity: dto.quantity, type: dto.type, note: dto.note } });
  }

  listInventory(params: { limit?: number; types?: ('IN' | 'ADJUSTMENT' | 'OUT')[]; productId?: number }) {
    const { limit, types, productId } = params;
    return this.prisma.inventory.findMany({
      where: {
        type: types ? { in: types } : undefined,
        productId: productId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: limit ?? 50,
      include: { product: true },
    });
  }

  async getAvailable(productId: number) {
    const entries = await this.prisma.inventory.findMany({ where: { productId } });
    // Sum IN and ADJUSTMENT as they both mutate stock count
    return entries.reduce((sum, e) => sum + Number(e.quantity), 0);
  }
}


