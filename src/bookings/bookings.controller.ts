import { Body, Controller, Get, Param, Post, Patch, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateBookingDto, SplitBookingDto, CreateBookingItemDto } from './dto';
import { BookingsService } from './bookings.service';
import { BookingRepairService } from './booking-repair.service';

@UseGuards(AuthGuard('jwt'))
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly bookingRepair: BookingRepairService,
  ) {}

  @Post()
  create(@Req() _req: any, @Body() dto: CreateBookingDto) {
    return this.bookings.createBooking(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.bookings.getBooking(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.bookings.updateBooking(Number(id), dto);
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

  // Booking Items (Addon)
  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: CreateBookingItemDto) {
    return this.bookings.addItem(Number(id), dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: CreateBookingItemDto) {
    return this.bookings.updateItem(Number(id), Number(itemId), dto);
  }

  @Delete(':id/items/:itemId')
  deleteItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.bookings.deleteItem(Number(id), Number(itemId));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.bookings.deleteBooking(Number(id));
  }

  // Repair endpoints
  @Get('repair/problematic')
  getProblematicBookings() {
    return this.bookingRepair.getProblematicBookings();
  }

  @Post('repair/fix-statuses')
  repairBookingStatuses() {
    return this.bookingRepair.repairBookingStatuses();
  }
}


