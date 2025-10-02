import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  list(bookingId: number) {
    return this.prisma.payment.findMany({ where: { bookingId }, orderBy: { paymentDate: 'desc' } });
  }

  async refund(bookingId: number, dto: { amount: string; method?: string }) {
    const amount = Number(dto.amount);
    if (!amount || amount <= 0) throw new BadRequestException('Invalid amount');
    return this.prisma.payment.create({ data: { bookingId, total: `-${amount}`, method: dto.method ?? 'REFUND' } });
  }

  async listAllWithEstimates(params: { type?: 'unpaid' | 'paid'; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    
    // Fetch bookings with basic info
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          owner: { select: { name: true } },
          serviceType: { include: { service: { select: { name: true } } } },
          pets: { select: { examinations: { select: { id: true } } } },
          deposits: { select: { amount: true } },
        },
      }),
      this.prisma.booking.count(),
    ]);

    // Calculate estimates for each booking
    const items = await Promise.all(
      bookings.map(async (booking) => {
        const hasExam = booking.pets.some((p) => p.examinations.length > 0);
        
        // Only calculate estimate for bookings with examinations
        let estimate = {
          serviceSubtotal: 0,
          baseService: 0,
          totalProducts: 0,
          total: 0,
          depositSum: 0,
          amountDue: 0,
        };
        
        if (hasExam) {
          try {
            estimate = await this.billing.estimate(booking.id);
          } catch {
            // If estimate fails, keep zeros
          }
        }

        return {
          id: booking.id,
          ownerName: booking.owner?.name ?? '-',
          serviceName: booking.serviceType?.service?.name ?? '-',
          typeName: booking.serviceType?.name,
          status: booking.status,
          serviceSubtotal: Number(estimate.serviceSubtotal ?? estimate.baseService ?? 0),
          totalProducts: Number(estimate.totalProducts ?? 0),
          total: Number(estimate.total ?? 0),
          depositSum: Number(estimate.depositSum ?? 0),
          amountDue: Number(estimate.amountDue ?? 0),
          hasExam,
        };
      }),
    );

    // Filter based on type
    const filtered =
      params.type === 'unpaid'
        ? items.filter((r) => r.amountDue > 0 && r.status !== 'COMPLETED')
        : params.type === 'paid'
          ? items.filter((r) => r.status === 'COMPLETED' || r.amountDue <= 0)
          : items;

    return { items: filtered, total, page, pageSize };
  }
}


