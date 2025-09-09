import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { CatalogService } from './catalog.service';

class CreateServiceTypeDto {
  @IsInt()
  serviceId!: number;

  @IsString()
  name!: string;

  @IsString()
  price!: string; // Decimal as string

  @IsOptional()
  @IsString()
  pricePerDay?: string | null;
}

class UpdateServiceTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  price?: string; // Decimal as string

  @IsOptional()
  @IsString()
  pricePerDay?: string | null;
}

@UseGuards(AuthGuard('jwt'))
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('services')
  getServices() {
    return this.catalog.listServices();
  }

  @Get('service-types')
  getServiceTypes(@Query('serviceId') serviceId?: string) {
    const sid = serviceId ? Number(serviceId) : undefined;
    return this.catalog.listServiceTypes(sid);
  }

  @Post('service-types')
  createServiceType(@Req() req: any, @Body() dto: CreateServiceTypeDto) {
    const role: string = req.user?.role;
    return this.catalog.createServiceType(role, dto);
  }

  @Patch('service-types/:id')
  updateServiceType(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateServiceTypeDto) {
    const role: string = req.user?.role;
    return this.catalog.updateServiceType(role, Number(id), dto);
  }
}


