import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingRepairService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Repair bookings that should have been updated to WAITING_TO_DEPOSIT status
   * after examination but weren't due to bugs
   */
  async repairBookingStatuses() {
    const problematicBookings = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        proceedToAdmission: false,
        serviceType: {
          pricePerDay: { not: null },
        },
        pets: {
          some: {
            examinations: {
              some: {
                OR: [
                  { weight: { not: null } },
                  { temperature: { not: null } },
                  { notes: { not: null } },
                  { chiefComplaint: { not: null } },
                  { additionalNotes: { not: null } },
                  { diagnosis: { not: null } },
                  { prognosis: { not: null } },
                  { doctorId: { not: null } },
                  { paravetId: { not: null } },
                  { adminId: { not: null } },
                  { groomerId: { not: null } },
                ],
              },
            },
          },
        },
      },
      include: {
        serviceType: { include: { service: true } },
        pets: { include: { examinations: true } },
      },
    });

    const repaired: any[] = [];

    for (const booking of problematicBookings) {
      try {
        const updated = await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            proceedToAdmission: true,
            status: 'WAITING_TO_DEPOSIT',
          },
        });

        repaired.push({
          id: booking.id,
          serviceTypeName: booking.serviceType?.name,
          serviceName: booking.serviceType?.service?.name,
          previousStatus: 'PENDING',
          newStatus: updated.status,
          previousProceedToAdmission: false,
          newProceedToAdmission: updated.proceedToAdmission,
        });

        console.log(`[BookingRepair] Fixed booking ${booking.id}: ${booking.serviceType?.service?.name} - ${booking.serviceType?.name}`);
      } catch (error) {
        console.error(`[BookingRepair] Failed to fix booking ${booking.id}:`, error);
      }
    }

    return {
      total: problematicBookings.length,
      repaired: repaired.length,
      failed: problematicBookings.length - repaired.length,
      details: repaired,
    };
  }

  /**
   * Get list of bookings that need repair (for diagnosis)
   */
  async getProblematicBookings() {
    return this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        proceedToAdmission: false,
        serviceType: {
          pricePerDay: { not: null },
        },
        pets: {
          some: {
            examinations: {
              some: {
                OR: [
                  { weight: { not: null } },
                  { temperature: { not: null } },
                  { notes: { not: null } },
                  { chiefComplaint: { not: null } },
                  { additionalNotes: { not: null } },
                  { diagnosis: { not: null } },
                  { prognosis: { not: null } },
                  { doctorId: { not: null } },
                  { paravetId: { not: null } },
                  { adminId: { not: null } },
                  { groomerId: { not: null } },
                ],
              },
            },
          },
        },
      },
      include: {
        serviceType: { include: { service: true } },
        pets: { include: { examinations: true } },
      },
    });
  }
}
