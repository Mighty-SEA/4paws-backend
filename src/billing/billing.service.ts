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
        pets: {
          include: {
            visits: { include: { productUsages: true, mixUsages: true } },
            examinations: { include: { productUsages: true } },
          },
        },
        deposits: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const pricePerDay = booking.serviceType.pricePerDay ? Number(booking.serviceType.pricePerDay) : 0;
    const totalDaily = pricePerDay
      ? booking.pets.reduce((sum, bp) => {
          const distinctDays = new Set(
            bp.visits.map((v) => {
              const d = new Date(v.visitDate);
              d.setHours(0, 0, 0, 0);
              return d.toISOString();
            }),
          );
          return sum + distinctDays.size * pricePerDay;
        }, 0)
      : 0;
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
            v.mixUsages.reduce((ms, mu) => ms + Number(mu.quantity) * Number(mu.unitPrice ?? 0), 0),
          0,
        ),
      0,
    );
    const totalProducts = totalExamProducts + totalVisitProducts;
    const total = totalDaily + totalProducts;
    const depositSum = booking.deposits.reduce((s, d) => s + Number(d.amount), 0);
    const amountDue = total - depositSum;
    return { totalDaily, totalProducts, total, depositSum, amountDue };
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


