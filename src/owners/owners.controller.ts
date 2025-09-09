import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto, CreatePetDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('owners')
export class OwnersController {
  constructor(private readonly owners: OwnersService) {}

  @Post()
  createOwner(@Body() dto: CreateOwnerDto) {
    return this.owners.createOwner(dto);
  }

  @Get()
  listOwners(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.owners.listOwners({ q, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
  }

  @Post(':ownerId/pets')
  createPet(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Body() dto: Omit<CreatePetDto, 'ownerId'>,
  ) {
    return this.owners.createPetForOwner({ ownerId, ...dto });
  }

  @Get(':id')
  getOwner(@Param('id', ParseIntPipe) id: number) {
    return this.owners.getOwnerDetail(id);
  }
}


