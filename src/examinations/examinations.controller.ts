import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateExaminationDto } from './dto';
import { ExaminationsService } from './examinations.service';

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/pets/:bookingPetId/examinations')
export class ExaminationsController {
  constructor(private readonly exams: ExaminationsService) {}

  @Post()
  create(@Req() _req: any, @Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string, @Body() dto: CreateExaminationDto) {
    return this.exams.create(Number(bookingId), Number(bookingPetId), dto);
  }
}


