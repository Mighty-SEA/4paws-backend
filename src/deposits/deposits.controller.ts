import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepositsService } from './deposits.service';

type CreateDepositDto = { amount: string; method?: string };

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/deposits')
export class DepositsController {
  constructor(private readonly deposits: DepositsService) {}

  @Post()
  create(@Param('bookingId') bookingId: string, @Body() dto: CreateDepositDto) {
    return this.deposits.create(Number(bookingId), dto);
  }

  @Get()
  list(@Param('bookingId') bookingId: string) {
    return this.deposits.list(Number(bookingId));
  }
}


