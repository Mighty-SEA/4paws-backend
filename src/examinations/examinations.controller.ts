import { Body, Controller, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
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

  @Patch('items')
  updateItems(
    @Param('bookingId') bookingId: string,
    @Param('bookingPetId') bookingPetId: string,
    @Body() dto: {
      meta?: {
        weight?: string;
        temperature?: string;
        notes?: string;
        chiefComplaint?: string;
        additionalNotes?: string;
        diagnosis?: string;
        prognosis?: string;
        doctorId?: number;
        paravetId?: number;
        adminId?: number;
        groomerId?: number;
      };
      singles?: { productId: number; quantity: string }[];
      mixes?: { label?: string; price?: string; components: { productId: number; quantity: string }[] }[];
    }
  ) {
    console.log('=== EXAMINATIONS CONTROLLER UPDATE ITEMS ===');
    console.log(`BookingId: ${bookingId}, BookingPetId: ${bookingPetId}`);
    console.log('Body:', JSON.stringify(dto, null, 2));
    return this.exams.updateItems(Number(bookingId), Number(bookingPetId), dto);
  }
}