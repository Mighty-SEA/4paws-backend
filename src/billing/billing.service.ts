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
        pets: { include: { dailyCharges: true } },
        deposits: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const totalDaily = booking.pets.reduce((sum, bp) => sum + bp.dailyCharges.reduce((s, c) => s + Number(c.amount), 0), 0);
    const totalProducts = 0; // product usage pricing belum dihitung di versi ini
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
      await tx.payment.create({ data: { bookingId, total: est.amountDue.toString(), method: dto.method } });
      await tx.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
      return { status: 'COMPLETED', totalPaid: est.amountDue };
    });
  }
}


