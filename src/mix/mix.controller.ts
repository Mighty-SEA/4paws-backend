import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MixService } from './mix.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class MixController {
  constructor(private readonly mix: MixService) {}

  @Get('mix-products')
  list() {
    return this.mix.list();
  }

  @Post('mix-products')
  create(@Req() req: any, @Body() dto: { name: string; description?: string; components: { productId: number; quantityBase: string }[] }) {
    return this.mix.createMix(req.user?.role, dto);
  }

  @Post('bookings/:bookingId/pets/:bookingPetId/mix-usage')
  use(@Param('bookingId') bookingId: string, @Param('bookingPetId') bookingPetId: string, @Body() dto: { mixProductId: number; quantity: string }) {
    return this.mix.useMix(Number(bookingId), Number(bookingPetId), dto);
  }
}


