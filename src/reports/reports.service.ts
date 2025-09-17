import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ProductUsageQuery = {
  start?: string;
  end?: string;
  groupBy?: 'day' | 'product' | 'source' | 'service';
  productIds?: number[];
  sourceTypes?: string[]; // visit|exam|mix
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async productUsage(params: ProductUsageQuery) {
    const { start, end, groupBy = 'day', productIds = [], sourceTypes = [] } = params;

    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    // Fetch visit/exam product usages
    const productUsage = (await this.prisma.productUsage.findMany({
      where: {
        AND: [
          startDate ? { createdAt: { gte: startDate } } : {},
          endDate ? { createdAt: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } } : {},
          productIds.length ? { productName: { in: await this.resolveProductNames(productIds) } } : {},
        ],
      },
      include: { examination: { include: { bookingPet: { include: { booking: { include: { owner: true, serviceType: { include: { service: true } } } }, pet: true } } } }, visit: { include: { bookingPet: { include: { booking: { include: { owner: true, serviceType: { include: { service: true } } } }, pet: true } } } } },
    } as any)) as any[];

    // Fetch mix usages and explode components
    const mixUsages = (await this.prisma.mixUsage.findMany({
      where: {
        AND: [
          startDate ? { createdAt: { gte: startDate } } : {},
          endDate ? { createdAt: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } } : {},
        ],
      },
      include: {
        mixProduct: { include: { components: { include: { product: true } } } },
        bookingPet: { include: { booking: { include: { owner: true, serviceType: { include: { service: true } } } }, pet: true } },
      },
    } as any)) as any[];

    const explodedMix = mixUsages.flatMap((mu) => {
      const qty = Number(mu.quantity);
      const unitPrice = Number(mu.unitPrice ?? 0);
      const totalComponents = mu.mixProduct.components.length || 1;
      return mu.mixProduct.components.map((comp) => {
        const componentQty = qty * Number(comp.quantityBase);
        const allocatedCost = totalComponents ? unitPrice / totalComponents : 0;
        return {
          date: mu.createdAt?.toISOString?.().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          sourceType: 'mix',
          productId: comp.productId,
          productName: comp.product.name,
          unit: comp.product.unit,
          quantity: componentQty,
          unitPrice: allocatedCost,
          cost: componentQty * allocatedCost,
          bookingId: mu.bookingPet.bookingId,
          ownerName: mu.bookingPet.booking.owner.name,
          petName: mu.bookingPet.pet?.name,
          serviceName: mu.bookingPet.booking.serviceType.name,
          userName: undefined,
        };
      });
    });

    const normalizedPU = productUsage.map((u: any) => {
      const isExam = Boolean(u.examinationId);
      const src = isExam ? 'exam' : 'visit';
      const bp = (isExam ? u.examination?.bookingPet : u.visit?.bookingPet) as any;
      return {
        date: u.createdAt?.toISOString?.().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        sourceType: src,
        productId: undefined,
        productName: u.productName,
        unit: undefined,
        quantity: Number(u.quantity ?? 0),
        unitPrice: Number(u.unitPrice ?? 0),
        cost: Number(u.quantity ?? 0) * Number(u.unitPrice ?? 0),
        bookingId: bp?.bookingId,
        ownerName: bp?.booking?.owner?.name,
        petName: bp?.pet?.name,
        serviceName: bp?.booking?.serviceType?.name,
        userName: undefined,
      };
    });

    let merged = [...normalizedPU, ...explodedMix];

    if (productIds.length) {
      const allowedNames = await this.resolveProductNames(productIds);
      merged = merged.filter((r) => (r.productId ? productIds.includes(r.productId) : allowedNames.includes(r.productName)));
    }
    if (sourceTypes.length) {
      merged = merged.filter((r) => sourceTypes.includes(r.sourceType));
    }

    // Optional grouping (ke depan bisa aggregate sum)
    if (groupBy === 'product') {
      // keep detail rows, or aggregate if needed
    } else if (groupBy === 'day') {
      // keep detail rows
    }

    return merged;
  }

  private async resolveProductNames(productIds: number[]): Promise<string[]> {
    if (!productIds.length) return [];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    return products.map((p) => p.name);
  }
}


