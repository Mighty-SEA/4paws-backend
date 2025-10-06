import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MixService } from '../mix/mix.service';

@Injectable()
export class ExaminationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mixService: MixService,
  ) {}

  private normalizeDecimalString(raw?: string): string | undefined {
    if (raw == null) return undefined;
    const s = String(raw).trim();
    if (!s) return undefined;
    const normalized = s.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
    if (!normalized) return undefined;
    return normalized;
  }

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
      products?: { productId?: number; productName?: string; quantity: string }[];
      mixes?: { mixName?: string; price?: string | number; components: { productId: number; quantity: string }[] }[];
      doctorId?: number;
      paravetId?: number;
      adminId?: number;
      groomerId?: number;
    },
  ) {
    console.log('=== CREATE EXAMINATION ===');
    console.log('BookingId:', bookingId, 'BookingPetId:', bookingPetId);
    console.log('DTO:', JSON.stringify(dto, null, 2));

    // Prevent creating empty examinations (which result in null columns)
    const hasMeaningfulData = Boolean(
      (dto.weight && String(dto.weight).trim()) ||
        (dto.temperature && String(dto.temperature).trim()) ||
        (dto.notes && String(dto.notes).trim()) ||
        (dto.chiefComplaint && String(dto.chiefComplaint).trim()) ||
        (dto.additionalNotes && String(dto.additionalNotes).trim()) ||
        (dto.diagnosis && String(dto.diagnosis).trim()) ||
        (dto.prognosis && String(dto.prognosis).trim()) ||
        dto.doctorId ||
        dto.paravetId ||
        dto.adminId ||
        dto.groomerId ||
        (Array.isArray(dto.products) && dto.products.some((p) => (p.productId || p.productName) && String(p.quantity ?? '').trim())) ||
        (Array.isArray(dto.mixes) && dto.mixes.some((m) => Array.isArray(m.components) && m.components.length > 0))
    );
    if (!hasMeaningfulData) {
      throw new BadRequestException('Tidak ada data pemeriksaan yang diisi');
    }

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
          weight: this.normalizeDecimalString(dto.weight),
          temperature: this.normalizeDecimalString(dto.temperature),
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

      console.log('Created examination:', exam.id);

      // Handle products
      if (dto.products?.length) {
        for (const p of dto.products) {
          const product = p.productId
            ? await tx.product.findUnique({ where: { id: Number(p.productId) } })
            : p.productName
            ? await tx.product.findFirst({ where: { name: p.productName } })
            : null;
          if (!product) continue;
          const quantity = this.normalizeDecimalString(p.quantity) ?? '0';
          await tx.productUsage.create({
            data: { examinationId: exam.id, productName: product.name, quantity, unitPrice: product.price },
          });
          await tx.inventory.create({ data: { productId: product.id, quantity: `-${quantity}`, type: 'OUT', note: `Usage exam #${exam.id}` } });
          console.log(`Added product: ${product.name}, qty: ${quantity}`);
        }
      }

      // Handle mixes
      if (dto.mixes?.length) {
        for (const mix of dto.mixes) {
          const baseName = mix.mixName || `Quick Mix - ${new Date().toISOString().slice(0, 10)}`;
          const priceStr = mix.price != null ? String(mix.price).trim().replace(/,/g, '.') : '0';

          const tempMix = await tx.mixProduct.create({ data: { name: baseName, description: 'Quick Mix - Temporary', price: priceStr } });
          await tx.mixComponent.createMany({
            data: (mix.components ?? []).map((c) => ({ mixProductId: tempMix.id, productId: c.productId, quantityBase: c.quantity })),
          });
          const mu = await tx.mixUsage.create({ data: { bookingPetId: bp.id, mixProductId: tempMix.id, quantity: '1', unitPrice: tempMix.price } });
          for (const c of mix.components ?? []) {
            const product = await tx.product.findUnique({ where: { id: c.productId } });
            if (!product) continue;
          const innerQty = Number(c.quantity);
          if (!Number.isFinite(innerQty) || innerQty <= 0) continue;
          // Treat quantities as base unit directly (no inner/denom conversion)
          const primaryQty = innerQty;
          await tx.inventory.create({ data: { productId: product.id, quantity: `-${primaryQty}`, type: 'OUT', note: `Quick Mix #${mu.id}` } });
          }
          console.log(`Added mix: ${baseName}`);
        }
      }

      // If this is a per-day service (pet hotel/rawat inap), after first exam mark booking as waiting to deposit
      const pricePerDay = bp.booking.serviceType?.pricePerDay;
      console.log(`[ExaminationService] Checking pricePerDay for booking ${bp.bookingId}:`, pricePerDay, typeof pricePerDay);
      
      if (pricePerDay) {
        console.log(`[ExaminationService] Updating booking ${bp.bookingId} status to WAITING_TO_DEPOSIT`);
        const updatedBooking = await tx.booking.update({ 
          where: { id: bp.bookingId }, 
          data: { proceedToAdmission: true, status: 'WAITING_TO_DEPOSIT' as any } 
        });
        console.log(`[ExaminationService] Booking ${bp.bookingId} updated successfully:`, {
          status: updatedBooking.status,
          proceedToAdmission: updatedBooking.proceedToAdmission
        });
      } else {
        console.log(`[ExaminationService] Booking ${bp.bookingId} is not per-day service, keeping status as is`);
      }

      const result = await tx.examination.findUnique({
        where: { id: exam.id },
        include: {
          productUsages: true,
          doctor: true,
          paravet: true,
          admin: true,
          groomer: true,
        },
      });

      console.log('Final examination result:', result);
      return result;
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
      products?: { productId?: number; productName?: string; quantity: string }[];
      mixes?: { mixName?: string; price?: string | number; components: { productId: number; quantity: string }[] }[];
      doctorId?: number;
      paravetId?: number;
      adminId?: number;
      groomerId?: number;
    },
  ) {
    console.log('=== UPDATE EXAMINATION ===');
    console.log('BookingId:', bookingId, 'BookingPetId:', bookingPetId);
    console.log('DTO:', JSON.stringify(dto, null, 2));

    // If the update payload has nothing meaningful, shortcut to returning latest exam unchanged
    const hasMeaningfulData = Boolean(
      (dto.weight && String(dto.weight).trim()) ||
        (dto.temperature && String(dto.temperature).trim()) ||
        (dto.notes && String(dto.notes).trim()) ||
        (dto.chiefComplaint && String(dto.chiefComplaint).trim()) ||
        (dto.additionalNotes && String(dto.additionalNotes).trim()) ||
        (dto.diagnosis && String(dto.diagnosis).trim()) ||
        (dto.prognosis && String(dto.prognosis).trim()) ||
        dto.doctorId ||
        dto.paravetId ||
        dto.adminId ||
        dto.groomerId ||
        (Array.isArray(dto.products) && dto.products.some((p) => (p.productId || p.productName) && String(p.quantity ?? '').trim())) ||
        (Array.isArray(dto.mixes) && dto.mixes.some((m) => Array.isArray(m.components) && m.components.length > 0))
    );

    const bp = await this.prisma.bookingPet.findFirst({
      where: { id: bookingPetId, bookingId },
      include: { examinations: { orderBy: { createdAt: 'desc' } } },
    });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    const latest = bp.examinations[0];
    if (!latest) {
      // If no existing exam, fallback to create
      return this.create(bookingId, bookingPetId, dto);
    }
    if (!hasMeaningfulData) {
      // Return latest unchanged
      return this.prisma.examination.findUnique({
        where: { id: latest.id },
        include: { productUsages: true, doctor: true, paravet: true, admin: true, groomer: true },
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.examination.update({
        where: { id: latest.id },
        data: {
          weight: this.normalizeDecimalString(dto.weight),
          temperature: this.normalizeDecimalString(dto.temperature),
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
      console.log('Updated examination:', exam.id);
      // Replace existing product usages when products array is provided (edit mode)
      if (Array.isArray(dto.products)) {
        // Revert previous usages back to inventory and delete them
        const existing = await tx.productUsage.findMany({ where: { examinationId: exam.id } });
        for (const pu of existing) {
          const prod = await tx.product.findFirst({ where: { name: pu.productName } });
          if (prod) {
            const qtyStr = String(pu.quantity ?? '0');
            await tx.inventory.create({
              data: {
                productId: prod.id,
                quantity: qtyStr,
                type: 'ADJUSTMENT',
                note: `Revert usage exam #${exam.id} (edit)`,
              },
            });
          }
        }
        await tx.productUsage.deleteMany({ where: { examinationId: exam.id } });

        // Insert new usages
        for (const p of dto.products) {
          const product = p.productId
            ? await tx.product.findUnique({ where: { id: Number(p.productId) } })
            : p.productName
            ? await tx.product.findFirst({ where: { name: p.productName } })
            : null;
          if (!product) continue;
          const quantity = this.normalizeDecimalString(p.quantity) ?? '0';
          await tx.productUsage.create({
            data: { examinationId: exam.id, productName: product.name, quantity, unitPrice: product.price },
          });
          await tx.inventory.create({
            data: { productId: product.id, quantity: `-${quantity}`, type: 'OUT', note: `Usage exam #${exam.id}` },
          });
          console.log(`(update) Replaced product: ${product.name}, qty: ${quantity}`);
        }
      }
      // Append mixes (create temporary mix and usage)
      if (dto.mixes?.length) {
        for (const mix of dto.mixes) {
          const baseName = mix.mixName || `Quick Mix - ${new Date().toISOString().slice(0, 10)}`;
          const priceStr = mix.price != null ? String(mix.price).trim().replace(/,/g, '.') : '0';
          const tempMix = await tx.mixProduct.create({ data: { name: baseName, description: 'Quick Mix - Temporary', price: priceStr } });
          await tx.mixComponent.createMany({
            data: (mix.components ?? []).map((c) => ({ mixProductId: tempMix.id, productId: c.productId, quantityBase: c.quantity })),
          });
          const mu = await tx.mixUsage.create({ data: { bookingPetId: bp.id, mixProductId: tempMix.id, quantity: '1', unitPrice: tempMix.price } });
          for (const c of mix.components ?? []) {
            const product = await tx.product.findUnique({ where: { id: c.productId } });
            if (!product) continue;
            const innerQty = Number(c.quantity);
            if (!Number.isFinite(innerQty) || innerQty <= 0) continue;
            // Treat quantities as base unit directly
            const primaryQty = innerQty;
            await tx.inventory.create({ data: { productId: product.id, quantity: `-${primaryQty}`, type: 'OUT', note: `Quick Mix #${mu.id}` } });
          }
          console.log(`(update) Added mix: ${baseName}`);
        }
      }
      return tx.examination.findUnique({
        where: { id: exam.id },
        include: {
          productUsages: true,
          doctor: true,
          paravet: true,
          admin: true,
          groomer: true,
        },
      });
    });
  }

  async updateItems(
    bookingId: number,
    bookingPetId: number,
    dto: {
      meta?: {
        weight?: string;
        temperature?: string;
        notes?: string;
        chiefComplaint?: string;
        additionalNotes?: string;
        diagnosis?: string;
        prognosis?: string;
        doctorId?: number;
        paravetId?: number;
        adminId?: number;
        groomerId?: number;
      };
      singles?: { productId: number; quantity: string }[];
      mixes?: { label?: string; price?: string; components: { productId: number; quantity: string }[] }[];
    }
  ) {
    console.log('=== UPDATE ITEMS EXAMINATION ===');
    console.log('BookingId:', bookingId, 'BookingPetId:', bookingPetId);
    console.log('DTO:', JSON.stringify(dto, null, 2));

    const bp = await this.prisma.bookingPet.findFirst({
      where: { id: bookingPetId, bookingId },
      include: { examinations: { orderBy: { createdAt: 'desc' } } },
    });
    if (!bp) throw new NotFoundException('BookingPet not found for given booking');
    const latest = bp.examinations[0];
    if (!latest) {
      throw new NotFoundException('No existing examination found to update');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update examination metadata
      const exam = await tx.examination.update({
        where: { id: latest.id },
        data: {
          weight: dto.meta?.weight ? this.normalizeDecimalString(dto.meta.weight) : undefined,
          temperature: dto.meta?.temperature ? this.normalizeDecimalString(dto.meta.temperature) : undefined,
          notes: dto.meta?.notes ?? undefined,
          chiefComplaint: dto.meta?.chiefComplaint ?? undefined,
          additionalNotes: dto.meta?.additionalNotes ?? undefined,
          diagnosis: dto.meta?.diagnosis ?? undefined,
          prognosis: dto.meta?.prognosis ?? undefined,
          doctorId: dto.meta?.doctorId ?? undefined,
          paravetId: dto.meta?.paravetId ?? undefined,
          adminId: dto.meta?.adminId ?? undefined,
          groomerId: dto.meta?.groomerId ?? undefined,
        },
      });
      console.log('Updated examination metadata:', exam.id);

      // Replace product usages (singles)
      if (Array.isArray(dto.singles)) {
        // Revert previous usages back to inventory and delete them
        const existing = await tx.productUsage.findMany({ where: { examinationId: exam.id } });
        for (const pu of existing) {
          const prod = await tx.product.findFirst({ where: { name: pu.productName } });
          if (prod) {
            const qtyStr = String(pu.quantity ?? '0');
            await tx.inventory.create({
              data: {
                productId: prod.id,
                quantity: qtyStr,
                type: 'ADJUSTMENT',
                note: `Revert usage exam #${exam.id} (items edit)`,
              },
            });
          }
        }
        await tx.productUsage.deleteMany({ where: { examinationId: exam.id } });

        // Insert new usages
        for (const p of dto.singles) {
          const product = await tx.product.findUnique({ where: { id: Number(p.productId) } });
          if (!product) continue;
          const quantity = this.normalizeDecimalString(p.quantity) ?? '0';
          await tx.productUsage.create({
            data: { examinationId: exam.id, productName: product.name, quantity, unitPrice: product.price },
          });
          await tx.inventory.create({
            data: { productId: product.id, quantity: `-${quantity}`, type: 'OUT', note: `Usage exam #${exam.id}` },
          });
          console.log(`(updateItems) Replaced single product: ${product.name}, qty: ${quantity}`);
        }
      }

      // Replace mixes
      if (Array.isArray(dto.mixes)) {
        // Delete existing mix usages for this bookingPet (that are not tied to visits)
        const existingMixUsages = await tx.mixUsage.findMany({
          where: { bookingPetId: bp.id, visitId: null },
          include: { mixProduct: { include: { components: true } } },
        });

        for (const mu of existingMixUsages) {
          // Revert inventory
          for (const c of mu.mixProduct.components) {
            const product = await tx.product.findUnique({ where: { id: c.productId } });
            if (!product) continue;
            const innerQty = Number(c.quantityBase);
            if (!Number.isFinite(innerQty) || innerQty <= 0) continue;
            await tx.inventory.create({
              data: {
                productId: product.id,
                quantity: String(innerQty),
                type: 'ADJUSTMENT',
                note: `Revert mix usage #${mu.id} (items edit)`,
              },
            });
          }
          // Delete the mix usage
          await tx.mixUsage.delete({ where: { id: mu.id } });
          // Delete the temporary mix product and its components
          await tx.mixComponent.deleteMany({ where: { mixProductId: mu.mixProductId } });
          await tx.mixProduct.delete({ where: { id: mu.mixProductId } });
        }

        // Create new mixes
        for (const mix of dto.mixes) {
          const baseName = mix.label || `Quick Mix - ${new Date().toISOString().slice(0, 10)}`;
          const priceStr = mix.price != null ? String(mix.price).trim().replace(/,/g, '.') : '0';
          const tempMix = await tx.mixProduct.create({
            data: { name: baseName, description: 'Quick Mix - Temporary', price: priceStr },
          });
          await tx.mixComponent.createMany({
            data: (mix.components ?? []).map((c) => ({
              mixProductId: tempMix.id,
              productId: c.productId,
              quantityBase: c.quantity,
            })),
          });
          const mu = await tx.mixUsage.create({
            data: { bookingPetId: bp.id, mixProductId: tempMix.id, quantity: '1', unitPrice: tempMix.price },
          });
          for (const c of mix.components ?? []) {
            const product = await tx.product.findUnique({ where: { id: c.productId } });
            if (!product) continue;
            const innerQty = Number(c.quantity);
            if (!Number.isFinite(innerQty) || innerQty <= 0) continue;
            const primaryQty = innerQty;
            await tx.inventory.create({
              data: { productId: product.id, quantity: `-${primaryQty}`, type: 'OUT', note: `Quick Mix #${mu.id}` },
            });
          }
          console.log(`(updateItems) Added mix: ${baseName}`);
        }
      }

      return tx.examination.findUnique({
        where: { id: exam.id },
        include: {
          productUsages: true,
          doctor: true,
          paravet: true,
          admin: true,
          groomer: true,
        },
      });
    });
  }
}