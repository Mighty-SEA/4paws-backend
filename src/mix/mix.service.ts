import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MixService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.mixProduct.findMany({ include: { components: { include: { product: true } } }, orderBy: { name: 'asc' } });
  }

  async createMix(_currentRole: string, dto: { name: string; description?: string; price?: string; components: { productId: number; quantityBase: string }[] }) {
    if (!dto.components?.length) throw new ForbiddenException('Components required');
    return this.prisma.$transaction(async (tx) => {
      const mix = await tx.mixProduct.create({ data: { name: dto.name, description: dto.description, price: dto.price ?? '0' } });
      await tx.mixComponent.createMany({
        data: dto.components.map((c) => ({ mixProductId: mix.id, productId: c.productId, quantityBase: c.quantityBase })),
      });
      return mix;
    });
  }

  async useMix(bookingId: number, bookingPetId: number, dto: { mixProductId: number; quantity: string; visitId?: number }) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId } });
    if (!bp) throw new NotFoundException('BookingPet not found');
    const mix = await this.prisma.mixProduct.findUnique({ where: { id: dto.mixProductId }, include: { components: true } });
    if (!mix) throw new NotFoundException('Mix not found');
    const qty = Number(dto.quantity);
    if (qty <= 0) throw new ForbiddenException('Quantity must be positive');
    return this.prisma.$transaction(async (tx) => {
      // create mix usage audit
      const mu = await tx.mixUsage.create({
        data: {
          bookingPetId: bp.id,
          mixProductId: mix.id,
          quantity: dto.quantity,
          visitId: dto.visitId ?? undefined,
          unitPrice: mix.price,
        },
      });
      // expand to inventory OUT (tanpa ProductUsage terikat pemeriksaan/visit)
      for (const comp of mix.components) {
        const needInInnerUnit = (Number(comp.quantityBase) || 0) * qty; // e.g., kapsul/ml/tablet
        if (needInInnerUnit <= 0) continue;
        const product = await tx.product.findUnique({ where: { id: comp.productId } });
        if (!product) throw new NotFoundException('Component product missing');
        // Konversi ke unit utama stok (primary unit). Jika 1 botol = 100 kapsul, 10 kapsul = 0.1 botol
        const denom = product.unitContentAmount ? Number(product.unitContentAmount) : undefined;
        const needPrimary = denom && denom > 0 ? needInInnerUnit / denom : needInInnerUnit;
        await tx.inventory.create({
          data: {
            productId: product.id,
            quantity: `-${needPrimary}`,
            type: 'OUT',
            note: `Mix #${mu.id}`,
          },
        });
      }
      return { ok: true };
    });
  }
}


