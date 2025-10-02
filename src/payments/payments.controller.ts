import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // New endpoint for listing all payments with estimates
  @Get('payments')
  listAll(
    @Query('type') type?: 'unpaid' | 'paid',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.payments.listAllWithEstimates({
      type,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // Existing endpoints for per-booking payments
  @Get('bookings/:bookingId/payments')
  list(@Param('bookingId') bookingId: string) {
    return this.payments.list(Number(bookingId));
  }

  @Post('bookings/:bookingId/payments/refund')
  refund(@Param('bookingId') bookingId: string, @Body() body: { amount: string; method?: string }) {
    return this.payments.refund(Number(bookingId), body);
  }
}
