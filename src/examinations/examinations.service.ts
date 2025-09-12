import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: number, bookingPetId: number, dto: { weight?: string; temperature?: string; notes?: string; products: { productName: string; quantity: string }[] }) {
    const bp = await this.prisma.bookingPet.findFirst({
      where: { id: bookingPetId, bookingId },
      include: { booking: { include: { serviceType: true, pets: { include: { examinations: true } } } } },
    });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    const isPerDay = Boolean(bp.booking.serviceType.pricePerDay);
    // Hanya 1 pemeriksaan per booking (termasuk pra ranap)
    const alreadyExamined = bp.booking.pets.some((p) => p.examinations.length > 0);
    if (alreadyExamined) throw new BadRequestException('Pemeriksaan sudah dilakukan untuk booking ini');
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.examination.create({
        data: {
          bookingPetId: bp.id,
          weight: dto.weight ? dto.weight : undefined,
          temperature: dto.temperature ? dto.temperature : undefined,
          notes: dto.notes,
        },
      });
      if (dto.products?.length) {
        for (const p of dto.products) {
          const product = await tx.product.findFirst({ where: { name: p.productName } });
          if (!product) continue;
          const quantity = p.quantity;
          await tx.productUsage.create({ data: { examinationId: exam.id, productName: product.name, quantity } });
          await tx.inventory.create({ data: { productId: product.id, quantity: `-${quantity}`, type: 'OUT', note: `Usage exam #${exam.id}` } });
        }
      }
      if (!isPerDay) {
        await tx.booking.update({ where: { id: bp.booking.id }, data: { status: 'COMPLETED' } });
      }
      return exam;
    });
  }
}


