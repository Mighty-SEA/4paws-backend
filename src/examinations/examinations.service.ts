import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MixService } from '../mix/mix.service';

@Injectable()
export class ExaminationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mixService: MixService,
  ) {}

  async create(
    bookingId: number,
    bookingPetId: number,
      dto: {
        weight?: string;
        temperature?: string;
        notes?: string;
        chiefComplaint?: string;
        additionalNotes?: string;
        diagnosis?: string;
        prognosis?: string;
        products: { productName: string; quantity: string }[];
        quickMix?: { mixName: string; components: { productId: number; quantity: string }[] }[];
        doctorId?: number;
        paravetId?: number;
      },
  ) {
    const bp = await this.prisma.bookingPet.findFirst({
      where: { id: bookingPetId, bookingId },
      include: { booking: { include: { serviceType: true } }, examinations: true },
    });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    // Batasi 1 pemeriksaan per hewan dalam booking ini
    const alreadyExamined = bp.examinations.length > 0;
    if (alreadyExamined) throw new BadRequestException('Pemeriksaan sudah dilakukan untuk booking ini');

    // Validasi peran dokter/paravet jika diisi
    if (dto.doctorId) {
      const doc = await this.prisma.staff.findUnique({ where: { id: dto.doctorId } });
      if (!doc) throw new BadRequestException('Dokter tidak ditemukan');
      if (doc.jobRole !== 'DOCTOR') throw new BadRequestException('Staff terpilih bukan Dokter');
    }
    if (dto.paravetId) {
      const pv = await this.prisma.staff.findUnique({ where: { id: dto.paravetId } });
      if (!pv) throw new BadRequestException('Paravet tidak ditemukan');
      if (pv.jobRole !== 'PARAVET') throw new BadRequestException('Staff terpilih bukan Paravet');
    }

    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.examination.create({
        data: {
          bookingPetId: bp.id,
          weight: dto.weight ? dto.weight : undefined,
          temperature: dto.temperature ? dto.temperature : undefined,
          notes: dto.notes,
          chiefComplaint: dto.chiefComplaint ?? undefined,
          additionalNotes: dto.additionalNotes ?? undefined,
          diagnosis: dto.diagnosis ?? undefined,
          prognosis: dto.prognosis ?? undefined,
          doctorId: dto.doctorId ?? undefined,
          paravetId: dto.paravetId ?? undefined,
        },
      });
      if (dto.products?.length) {
        for (const p of dto.products) {
          const product = await tx.product.findFirst({ where: { name: p.productName } });
          if (!product) continue;
          const quantity = p.quantity;
          await tx.productUsage.create({
            data: { examinationId: exam.id, productName: product.name, quantity, unitPrice: product.price },
          });
          // Pemeriksaan menggunakan unit utama (primary unit)
          await tx.inventory.create({ data: { productId: product.id, quantity: `-${quantity}`, type: 'OUT', note: `Usage exam #${exam.id}` } });
        }
      }
      return exam;
    });
  }

  async createWithQuickMix(
    bookingId: number,
    bookingPetId: number,
    dto: {
      weight?: string;
      temperature?: string;
      notes?: string;
      chiefComplaint?: string;
      additionalNotes?: string;
      diagnosis?: string;
      prognosis?: string;
      products: { productName: string; quantity: string }[];
      quickMix?: { mixName: string; components: { productId: number; quantity: string }[] }[];
      doctorId?: number;
      paravetId?: number;
    },
  ) {
    // Create examination first
    const exam = await this.create(bookingId, bookingPetId, dto);

    // Handle quick mix after examination is created
    if (dto.quickMix?.length) {
      for (const mix of dto.quickMix) {
        await this.mixService.createQuickMix(bookingId, bookingPetId, {
          mixName: mix.mixName,
          components: mix.components,
          examinationId: exam.id,
        });
      }
    }

    return exam;
  }
}


