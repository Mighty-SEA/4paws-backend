import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@Param('bookingId') bookingId: string) {
    return this.payments.list(Number(bookingId));
  }

  @Post('refund')
  refund(@Param('bookingId') bookingId: string, @Body() body: { amount: string; method?: string }) {
    return this.payments.refund(Number(bookingId), body);
  }
}
