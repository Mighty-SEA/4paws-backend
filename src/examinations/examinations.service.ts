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
        adminId?: number;
        groomerId?: number;
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
          adminId: dto.adminId ?? undefined,
          groomerId: dto.groomerId ?? undefined,
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
      // Do not auto-change booking status here.
      // Status transitions are handled explicitly from the frontend buttons
      // (Lanjutkan ke Deposit => WAITING_TO_DEPOSIT, Selesai/Save => COMPLETED for non per-day).
      return exam;
    });
  }

  async update(
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
      adminId?: number;
      groomerId?: number;
    },
  ) {
    const bp = await this.prisma.bookingPet.findFirst({
      where: { id: bookingPetId, bookingId },
      include: { examinations: true },
    });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    const latest = bp.examinations[0] ?? (await this.prisma.examination.findFirst({ where: { bookingPetId }, orderBy: { createdAt: 'desc' } }));
    if (!latest) {
      // If no existing exam, fallback to create
      return this.create(bookingId, bookingPetId, dto);
    }
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.examination.update({
        where: { id: latest.id },
        data: {
          weight: dto.weight ? dto.weight : undefined,
          temperature: dto.temperature ? dto.temperature : undefined,
          notes: dto.notes,
          chiefComplaint: dto.chiefComplaint ?? undefined,
          additionalNotes: dto.additionalNotes ?? undefined,
          diagnosis: dto.diagnosis ?? undefined,
          prognosis: dto.prognosis ?? undefined,
          doctorId: dto.doctorId ?? undefined,
          paravetId: dto.paravetId ?? undefined,
          adminId: dto.adminId ?? undefined,
          groomerId: dto.groomerId ?? undefined,
        },
      });
      // For simplicity, keep existing usages; advanced reconciliation can be added later
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


