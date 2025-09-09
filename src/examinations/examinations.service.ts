import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: number, bookingPetId: number, dto: { weight?: string; temperature?: string; notes?: string; products: { productName: string; quantity: string }[] }) {
    const bp = await this.prisma.bookingPet.findFirst({ where: { id: bookingPetId, bookingId } });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
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
        await tx.productUsage.createMany({
          data: dto.products.map((p) => ({ examinationId: exam.id, productName: p.productName, quantity: p.quantity })),
        });
      }
      return exam;
    });
  }
}


