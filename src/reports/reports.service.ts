import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ProductUsageQuery = {
  start?: string;
  end?: string;
  groupBy?: 'day' | 'product' | 'source' | 'service';
  productIds?: number[];
  sourceTypes?: string[]; // visit|exam|mix
};
type ProductUsageSummaryQuery = { start?: string; end?: string };

type HandlingQuery = {
  start?: string;
  end?: string;
  staffId?: number;
  role?: 'DOCTOR' | 'PARAVET' | 'ADMIN' | 'GROOMER' | 'ALL';
  page?: number;
  pageSize?: number;
  sort?: 'asc' | 'desc';
};

type RevenueQuery = {
  start?: string;
  end?: string;
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

  async productUsageSummary(params: ProductUsageSummaryQuery) {
    const { start, end } = params;
    // Ambil detail gabungan
    const detail = (await this.productUsage({ start, end })) as any[];

    // Kumpulkan nama produk unik untuk lookup unit & harga
    const productNames = Array.from(new Set(detail.map((d) => String(d.productName ?? 'Unknown')))).filter(Boolean);
    const products = await this.prisma.product.findMany({ where: { name: { in: productNames } } });
    const nameToInfo = new Map<string, { price: number; unit?: string }>();
    for (const p of products) {
      nameToInfo.set(p.name, {
        price: Number(p.price ?? 0),
        unit: (p as any).unit,
      });
    }

    // Agregasi per produk dengan konversi unit & fallback biaya
    const summary = new Map<string, { productName: string; timesUsed: number; totalPrimaryQty: number; totalCost: number; unit?: string }>();
    for (const row of detail) {
      const key = String(row.productName ?? 'Unknown');
      const info = nameToInfo.get(key);
      const rawQty = Number(row.quantity ?? 0);
      // Semua qty dianggap unit utama (base unit)
      const primaryQty = rawQty;

      // Hitung biaya: gunakan cost yang ada, jika 0/null fallback ke (unitPrice || master price) * primaryQty
      const unitPrice = Number(row.unitPrice ?? 0);
      const rowCost = Number(row.cost ?? 0);
      const fallbackUnitPrice = unitPrice > 0 ? unitPrice : Number(info?.price ?? 0);
      const cost = rowCost > 0 ? rowCost : primaryQty * fallbackUnitPrice;

      const prev = summary.get(key) || { productName: key, timesUsed: 0, totalPrimaryQty: 0, totalCost: 0, unit: info?.unit };
      prev.timesUsed += 1;
      prev.totalPrimaryQty += primaryQty;
      prev.totalCost += cost;
      summary.set(key, prev);
    }

    return Array.from(summary.values()).sort((a, b) => b.timesUsed - a.timesUsed);
  }

  private async resolveProductNames(productIds: number[]): Promise<string[]> {
    if (!productIds.length) return [];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    return products.map((p) => p.name);
  }

  async handling(params: HandlingQuery) {
    const {
      start,
      end,
      staffId,
      role = 'ALL',
      page = 1,
      pageSize = 20,
      sort = 'desc',
    } = params;

    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    const examWhere: any = { AND: [] };
    if (startDate) examWhere.AND.push({ createdAt: { gte: startDate } });
    if (endDate) examWhere.AND.push({ createdAt: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } });
    if (staffId) {
      if (role === 'DOCTOR') {
        examWhere.AND.push({ doctorId: staffId });
      } else if (role === 'PARAVET') {
        examWhere.AND.push({ paravetId: staffId });
      } else {
        if (role === 'ADMIN') {
          examWhere.AND.push({ adminId: staffId });
        } else if (role === 'GROOMER') {
          examWhere.AND.push({ groomerId: staffId });
        } else {
          examWhere.AND.push({ OR: [{ doctorId: staffId }, { paravetId: staffId }, { adminId: staffId }, { groomerId: staffId }] });
        }
      }
    }

    const visitWhere: any = { AND: [] };
    if (startDate) visitWhere.AND.push({ visitDate: { gte: startDate } });
    if (endDate) visitWhere.AND.push({ visitDate: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } });
    if (staffId) {
      if (role === 'DOCTOR') {
        visitWhere.AND.push({ doctorId: staffId });
      } else if (role === 'PARAVET') {
        visitWhere.AND.push({ paravetId: staffId });
      } else {
        if (role === 'ADMIN') {
          visitWhere.AND.push({ adminId: staffId });
        } else if (role === 'GROOMER') {
          visitWhere.AND.push({ groomerId: staffId });
        } else {
          visitWhere.AND.push({ OR: [{ doctorId: staffId }, { paravetId: staffId }, { adminId: staffId }, { groomerId: staffId }] });
        }
      }
    }

    const [exams, visits] = await Promise.all([
      this.prisma.examination.findMany({
        where: examWhere.AND.length ? examWhere : undefined,
        include: {
          bookingPet: {
            include: { booking: { include: { owner: true, serviceType: { include: { service: true } } } }, pet: true },
          },
          doctor: true,
          paravet: true,
          admin: true,
          groomer: true,
        },
      } as any),
      this.prisma.visit.findMany({
        where: visitWhere.AND.length ? visitWhere : undefined,
        include: {
          bookingPet: {
            include: { booking: { include: { owner: true, serviceType: { include: { service: true } } } }, pet: true },
          },
          doctor: true,
          paravet: true,
          admin: true,
          groomer: true,
        },
      } as any),
    ]);

    type HandlingItem = {
      date: string;
      type: 'EXAM' | 'VISIT' | 'SERVICE';
      bookingId?: number;
      bookingPetId?: number;
      ownerName?: string;
      petName?: string;
      serviceName?: string;
      doctorName?: string;
      paravetName?: string;
      adminName?: string;
      groomerName?: string;
      detail?: string;
    };

    const examItems: HandlingItem[] = (exams as any[]).map((e) => {
      const bp = e.bookingPet as any;
      const booking = bp?.booking as any;
      return {
        date: (e.createdAt as Date)?.toISOString?.().slice(0, 19) ?? new Date().toISOString().slice(0, 19),
        type: 'EXAM',
        bookingId: booking?.id ?? bp?.bookingId,
        bookingPetId: bp?.id,
        ownerName: booking?.owner?.name,
        petName: bp?.pet?.name,
        serviceName: booking?.serviceType?.name,
        doctorName: e.doctor?.name,
        paravetName: e.paravet?.name,
        adminName: e.admin?.name,
        groomerName: e.groomer?.name,
        detail: e.diagnosis ?? e.notes ?? undefined,
      };
    });

    const visitItems: HandlingItem[] = (visits as any[]).map((v) => {
      const bp = v.bookingPet as any;
      const booking = bp?.booking as any;
      return {
        date: (v.visitDate as Date)?.toISOString?.().slice(0, 19) ?? new Date().toISOString().slice(0, 19),
        type: 'VISIT',
        bookingId: booking?.id ?? bp?.bookingId,
        bookingPetId: bp?.id,
        ownerName: booking?.owner?.name,
        petName: bp?.pet?.name,
        serviceName: booking?.serviceType?.name,
        doctorName: v.doctor?.name,
        paravetName: v.paravet?.name,
        adminName: v.admin?.name,
        groomerName: v.groomer?.name,
        detail: v.notes ?? undefined,
      };
    });

    // Service items from booking add-ons and primary
    const itemWhere: any = { AND: [] };
    if (startDate) itemWhere.AND.push({ createdAt: { gte: startDate } });
    if (endDate)
      itemWhere.AND.push({ createdAt: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } });
    const serviceRows = await this.prisma.bookingItem.findMany({
      where: itemWhere.AND.length ? itemWhere : undefined,
      include: {
        serviceType: { include: { service: true } },
        booking: { include: { owner: true, serviceType: { include: { service: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    } as any);
    const serviceItems: HandlingItem[] = (serviceRows as any[]).map((it) => {
      return {
        date: (it.createdAt as Date)?.toISOString?.().slice(0, 19) ?? new Date().toISOString().slice(0, 19),
        type: 'SERVICE',
        bookingId: it.bookingId,
        ownerName: it.booking?.owner?.name,
        serviceName: it.serviceType?.name ?? it.booking?.serviceType?.name,
        detail: it.role,
      } as HandlingItem;
    });

    let merged: HandlingItem[] = [...examItems, ...visitItems, ...serviceItems];

    // If role specified without staffId, optionally filter to items that have that role filled
    if (!staffId && role === 'DOCTOR') merged = merged.filter((r) => r.doctorName);
    if (!staffId && role === 'PARAVET') merged = merged.filter((r) => r.paravetName);
    if (!staffId && role === 'ADMIN') merged = merged.filter((r) => r.adminName);
    if (!staffId && role === 'GROOMER') merged = merged.filter((r) => r.groomerName);

    merged.sort((a, b) => (sort === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    const total = merged.length;
    const startIdx = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    const endIdx = startIdx + Math.max(1, pageSize);
    const pageItems = merged.slice(startIdx, endIdx);

    return { items: pageItems, total, page, pageSize };
  }

  async revenue(params: RevenueQuery) {
    const { start, end } = params;

    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    // Fetch all payments that have been made (completed payments)
    const payments = await this.prisma.payment.findMany({
      where: {
        AND: [
          startDate ? { createdAt: { gte: startDate } } : {},
          endDate ? { createdAt: { lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) } } : {},
        ],
      },
      include: {
        booking: {
          include: {
            owner: true,
            serviceType: { include: { service: true } },
            items: { include: { serviceType: { include: { service: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform payments to revenue data
    const revenueData = payments.map((payment) => {
      const booking = payment.booking as any;
      const primaryService = booking.items?.find((item: any) => item.role === 'PRIMARY')?.serviceType || booking.serviceType;
      
      return {
        id: payment.id,
        date: payment.createdAt.toISOString().slice(0, 10),
        bookingId: booking.id,
        ownerName: booking.owner?.name,
        serviceName: primaryService?.service?.name || 'Unknown Service',
        serviceTypeName: primaryService?.name || 'Unknown Type',
        method: payment.method || 'Unknown',
        amount: Number(payment.total),
        status: 'PAID',
        invoiceNo: payment.invoiceNo,
      };
    });

    // Always return individual payment records (like payments page)
    return revenueData;
  }
}


