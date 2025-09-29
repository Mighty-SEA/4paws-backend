import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto, CreatePetDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { AllowRoles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('owners')
export class OwnersController {
  constructor(private readonly owners: OwnersService) {}

  @Post()
  createOwner(@Body() dto: CreateOwnerDto) {
    return this.owners.createOwner(dto);
  }

  @AllowRoles('MASTER', 'ADMIN')
  @Put(':id')
  updateOwner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<{ name: string; phone: string; email?: string; address: string }>,
  ) {
    return this.owners.updateOwner(id, dto);
  }

  @AllowRoles('MASTER')
  @Delete(':id')
  deleteOwner(@Param('id', ParseIntPipe) id: number) {
    return this.owners.deleteOwner(id);
  }

  @Get()
  listOwners(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.owners.listOwners({ q, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
  }

  @Get('pets')
  listPets(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.owners.listPets({ q, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
  }

  @Post(':ownerId/pets')
  createPet(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Body() dto: Omit<CreatePetDto, 'ownerId'>,
  ) {
    return this.owners.createPetForOwner({ ownerId, ...dto });
  }

  @AllowRoles('MASTER', 'ADMIN')
  @Put('pets/:petId')
  updatePet(
    @Param('petId', ParseIntPipe) petId: number,
    @Body() dto: Partial<{ name: string; species: string; breed: string; birthdate: string }>,
  ) {
    return this.owners.updatePet(petId, dto);
  }

  @AllowRoles('MASTER')
  @Delete('pets/:petId')
  deletePet(@Param('petId', ParseIntPipe) petId: number) {
    return this.owners.deletePet(petId);
  }

  @Get(':id')
  getOwner(@Param('id', ParseIntPipe) id: number) {
    return this.owners.getOwnerDetail(id);
  }

  @Get('pets/:petId/medical-records')
  getPetMedicalRecords(@Param('petId', ParseIntPipe) petId: number) {
    return this.owners.getPetMedicalRecords(petId);
  }
}


