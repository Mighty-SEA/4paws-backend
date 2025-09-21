import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VisitsService } from './visits.service';

type CreateVisitDto = {
  visitDate?: string;
  weight?: string;
  temperature?: string;
  notes?: string;
  products?: { productId?: number; productName?: string; quantity: string }[];
  // Satwagia-like extras
  doctorId?: number;
  paravetId?: number;
  adminId?: number;
  groomerId?: number;
  urine?: string;
  defecation?: string;
  appetite?: string;
  condition?: string;
  symptoms?: string;
};

@UseGuards(AuthGuard('jwt'))
@Controller('bookings/:bookingId/pets/:bookingPetId/visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Post()
  create(@Req() _req: any, @Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string, @Body() dto: CreateVisitDto) {
    return this.visits.create(Number(bookingId), Number(bookingPetId), dto);
  }
}



