import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateExaminationDto } from './dto';
import { ExaminationsService } from './examinations.service';

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/pets/:bookingPetId/examinations')
export class ExaminationsController {
  constructor(private readonly exams: ExaminationsService) {}

  @Post()
  create(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string, @Body() dto: CreateExaminationDto) {
    console.log('=== EXAMINATIONS CONTROLLER CREATE ===');
    console.log(`BookingId: ${bookingId}, BookingPetId: ${bookingPetId}`);
    console.log('Body:', JSON.stringify(dto, null, 2));
    return this.exams.create(Number(bookingId), Number(bookingPetId), dto);
  }

  @Put()
  update(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string, @Body() dto: CreateExaminationDto) {
    console.log('=== EXAMINATIONS CONTROLLER UPDATE ===');
    console.log(`BookingId: ${bookingId}, BookingPetId: ${bookingPetId}`);
    console.log('Body:', JSON.stringify(dto, null, 2));
    return this.exams.update(Number(bookingId), Number(bookingPetId), dto);
  }
}