import { Body, Controller, Get, Param, Post, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateBookingDto, SplitBookingDto } from './dto';
import { BookingsService } from './bookings.service';

@UseGuards(AuthGuard('jwt'))
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@Req() _req: any, @Body() dto: CreateBookingDto) {
    return this.bookings.createBooking(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.bookings.getBooking(Number(id));
  }

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.bookings.listBookings({ page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
  }

  @Patch(':id/plan-admission')
  planAdmission(@Param('id') id: string) {
    return this.bookings.planAdmission(Number(id));
  }

  @Post(':id/split')
  split(@Param('id') id: string, @Body() dto: SplitBookingDto) {
    return this.bookings.splitBooking(Number(id), dto.petIds);
  }
}


