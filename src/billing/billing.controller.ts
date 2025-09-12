import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('estimate')
  estimate(@Param('bookingId') bookingId: string) {
    return this.billing.estimate(Number(bookingId));
  }

  @Post('checkout')
  checkout(@Param('bookingId') bookingId: string, @Body() body: { method?: string }) {
    return this.billing.checkout(Number(bookingId), body ?? {});
  }

  @Get('invoice')
  invoice(@Param('bookingId') bookingId: string) {
    return this.billing.invoice(Number(bookingId));
  }
}


