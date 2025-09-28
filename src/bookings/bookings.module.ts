import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsService } from './bookings.service';
import { BookingRepairService } from './booking-repair.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [BookingsService, BookingRepairService],
  controllers: [BookingsController],
})
export class BookingsModule {}


