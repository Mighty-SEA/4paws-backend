import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepositsService } from './deposits.service';

type CreateDepositDto = { amount: string; method?: string; estimatedTotal?: string; startDate?: string; endDate?: string };

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/deposits')
export class DepositsController {
  constructor(private readonly deposits: DepositsService) {}

  @Post()
  create(@Param('bookingId') bookingId: string, @Body() dto: CreateDepositDto) {
    return this.deposits.create(Number(bookingId), dto);
  }

  @Put(':id')
  update(@Param('bookingId') bookingId: string, @Param('id') id: string, @Body() dto: CreateDepositDto) {
    return this.deposits.update(Number(bookingId), Number(id), dto);
  }

  @Get()
  list(@Param('bookingId') bookingId: string) {
    return this.deposits.list(Number(bookingId));
  }

  @Delete(':id')
  remove(@Param('bookingId') bookingId: string, @Param('id') id: string) {
    return this.deposits.remove(Number(bookingId), Number(id));
  }
}


