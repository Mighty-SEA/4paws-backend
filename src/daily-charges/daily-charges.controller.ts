import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DailyChargesService } from './daily-charges.service';

type CreateChargeDto = { amount: string; description?: string; chargeDate?: string };

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/pets/:bookingPetId/daily-charges')
export class DailyChargesController {
  constructor(private readonly svc: DailyChargesService) {}

  @Post()
  create(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string, @Body() dto: CreateChargeDto) {
    return this.svc.create(Number(bookingId), Number(bookingPetId), dto);
  }

  @Get()
  list(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string) {
    return this.svc.list(Number(bookingId), Number(bookingPetId));
  }

  @Post('generate-today')
  generateToday(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string) {
    return this.svc.generateToday(Number(bookingId), Number(bookingPetId));
  }

  @Post('generate-range')
  generateRange(
    @Param('bookingId') bookingId: string,
    @Param('bookingPetId') bookingPetId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.svc.generateRange(Number(bookingId), Number(bookingPetId), start, end);
  }

  @Post('generate-until-checkout')
  generateUntilCheckout(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string) {
    return this.svc.generateUntilCheckout(Number(bookingId), Number(bookingPetId));
  }
}


