import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async estimate(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceType: true,
        items: { include: { serviceType: true } },
        pets: {
          include: {
            visits: { include: { productUsages: true, mixUsages: { include: { mixProduct: true } } } },
            examinations: { include: { productUsages: true, doctor: true, paravet: true, admin: true, groomer: true } },
            mixUsages: { where: { visitId: null }, include: { mixProduct: true } },
            dailyCharges: true,
          },
        },
        deposits: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    // Hitung biaya jasa dari PRIMARY + ADDON
    function normalizeDay(date: Date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    function calcDays(start?: Date | null, end?: Date | null) {
      if (!start || !end) return 0;
      const s = normalizeDay(start);
      const e = normalizeDay(end);
      const msPerDay = 24 * 60 * 60 * 1000;
      const diff = Math.ceil((e.getTime() - s.getTime()) / msPerDay);
      return Math.max(0, diff);
    }

    // Buat array semua item: tambahkan item PRIMARY implisit hanya jika belum ada PRIMARY eksplisit
    const hasExplicitPrimary = booking.items.some((it: any) => it.role === 'PRIMARY' && it.serviceTypeId === booking.serviceTypeId);
    const implicitPrimary = booking.serviceTypeId && !hasExplicitPrimary
      ? [{
          role: 'PRIMARY' as any,
          quantity: 1,
          startDate: booking.startDate,
          endDate: booking.endDate,
          unitPrice: null as any,
          serviceType: booking.serviceType,
        }]
      : [];
    const items = [...implicitPrimary, ...booking.items];

    let serviceSubtotal = 0;
    for (const it of items) {
      const qty = Number((it as any).quantity ?? 1);
      const st = (it as any).serviceType;
      const perDay = st?.pricePerDay ? Number(st.pricePerDay) : 0;
      const flat = st?.price ? Number(st.price) : 0;
      // Jika unitPrice tidak diisi (null/undefined/empty string), fallback ke harga default service type
      const hasCustomUnit = (it as any).unitPrice !== undefined && (it as any).unitPrice !== null && String((it as any).unitPrice) !== '';
      const unit = hasCustomUnit ? Number((it as any).unitPrice) : (perDay ? perDay : flat);
      if (perDay) {
        const s = (it as any).startDate ?? booking.startDate;
        const e = (it as any).endDate ?? booking.endDate;
        const days = calcDays(s as any, e as any);
        // Per item per-hari tidak dikalikan jumlah pets, kecuali ingin meniru perilaku lama pada PRIMARY.
        // Untuk kompatibilitas: jika item adalah implicitPrimary dan sebelumnya mengalikan pets, pertahankan.
        const petFactor = st === booking.serviceType && (implicitPrimary.length ? booking.pets.length : 1);
        serviceSubtotal += days * unit * (petFactor || 1) * qty;
      } else {
        // non per-hari: bila ingin per-hewan seperti perilaku lama, kalikan jumlah hewan yang diperiksa.
        if (st === booking.serviceType && !perDay) {
          const examinedPetCount = booking.pets.reduce((count, bp) => count + (bp.examinations.length > 0 ? 1 : 0), 0);
          serviceSubtotal += unit * examinedPetCount * qty;
        } else {
          serviceSubtotal += unit * qty;
        }
      }
    }
    // Map product prices for quick lookup
    const products = await this.prisma.product.findMany({ select: { name: true, price: true } });
    const nameToPrice = new Map(products.map((p) => [p.name, Number(p.price)]));
    const totalExamProducts = booking.pets.reduce(
      (sum, bp) =>
        sum +
        bp.examinations.reduce(
          (es, ex) => es + ex.productUsages.reduce((ps, pu) => ps + Number(pu.quantity) * Number(pu.unitPrice ?? nameToPrice.get(pu.productName) ?? 0), 0),
          0,
        ),
      0,
    );
    const totalVisitProducts = booking.pets.reduce(
      (sum, bp) =>
        sum +
        bp.visits.reduce(
          (vs, v) =>
            vs +
            v.productUsages.reduce((ps, pu) => ps + Number(pu.quantity) * Number(pu.unitPrice ?? nameToPrice.get(pu.productName) ?? 0), 0) +
            v.mixUsages.reduce((ms, mu) => ms + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0), 0),
          0,
        ),
      0,
    );
    const totalStandaloneMix = booking.pets.reduce(
      (sum, bp) => sum + bp.mixUsages.reduce((ms, mu) => ms + Number(mu.quantity) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0), 0),
      0,
    );
    const totalDailyCharges = booking.pets.reduce((sum, bp) => sum + bp.dailyCharges.reduce((cs, c) => cs + Number(c.amount ?? 0), 0), 0);
    const totalProducts = totalExamProducts + totalVisitProducts + totalStandaloneMix;
    // Total baru = subtotal jasa (PRIMARY + ADDON) + products + daily charges
    const total = serviceSubtotal + totalProducts + totalDailyCharges;
    const depositSum = booking.deposits.reduce((s, d) => s + Number(d.amount), 0);
    const amountDue = total - depositSum;
    // Backward compatibility fields for existing UI
    // Untuk layanan per-hari, totalDaily diisi biaya PRIMARY per-hari (tanpa addon).
    // Untuk layanan non per-hari, baseService diisi seluruh subtotal jasa (PRIMARY + ADDON).
    const isPrimaryPerDay = !!booking.serviceType?.pricePerDay;
    // Hitung totalDaily legacy berdasarkan implicitPrimary per-hari
    let legacyTotalDaily = 0;
    if (implicitPrimary.length && booking.serviceType?.pricePerDay) {
      const ip = implicitPrimary[0] as any;
      const unit = ip.unitPrice != null ? Number(ip.unitPrice) : Number(booking.serviceType.pricePerDay ?? 0);
      const days = calcDays(ip.startDate ?? booking.startDate, ip.endDate ?? booking.endDate);
      const petFactor = booking.pets.length;
      legacyTotalDaily = days * unit * petFactor;
    }
    const totalDaily = isPrimaryPerDay ? legacyTotalDaily : 0;
    const baseService = isPrimaryPerDay ? 0 : serviceSubtotal;
    return { serviceSubtotal, totalProducts, totalDailyCharges, total, depositSum, amountDue, totalDaily, baseService };
  }

  async checkout(bookingId: number, dto: { method?: string }) {
    const est = await this.estimate(bookingId);
    if (est.amountDue <= 0) {
      // tetap selesaikan booking meski tidak ada tagihan
      await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
      if (est.amountDue < 0) {
        // refund belum diimplementasi
      }
      return { status: 'COMPLETED', totalPaid: 0, amountDue: est.amountDue };
    }
    return this.prisma.$transaction(async (tx) => {
      const invoiceNo = `INV-${bookingId}-${Date.now()}`;
      await tx.payment.create({ data: { bookingId, total: est.amountDue.toString(), method: dto.method, invoiceNo } });
      await tx.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
      return { status: 'COMPLETED', totalPaid: est.amountDue, invoiceNo };
    });
  }

  async invoice(bookingId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { paymentDate: 'desc' },
    });
    if (!payment) throw new NotFoundException('Invoice not found');
    return payment;
  }
}


