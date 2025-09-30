import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AllowRoles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';
import type { CreateBankAccountDto, UpdateBankAccountDto, UpdateStoreSettingDto, CreatePetSpeciesDto, UpdatePetSpeciesDto } from './dto';

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getStoreSetting() {
    return this.settings.getStoreSetting();
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Put()
  updateStoreSetting(@Body() dto: UpdateStoreSettingDto) {
    return this.settings.upsertStoreSetting(dto);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Post('bank-accounts')
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.settings.createBankAccount(dto);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Put('bank-accounts/:id')
  updateBankAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.settings.updateBankAccount(id, dto);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Delete('bank-accounts/:id')
  deleteBankAccount(@Param('id', ParseIntPipe) id: number) {
    return this.settings.deleteBankAccount(id);
  }

  // Pet Species
  @Get('pet-species')
  listPetSpecies() {
    return this.settings.listPetSpecies();
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Post('pet-species')
  createPetSpecies(@Body() dto: CreatePetSpeciesDto) {
    return this.settings.createPetSpecies(dto);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Put('pet-species/:id')
  updatePetSpecies(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePetSpeciesDto) {
    return this.settings.updatePetSpecies(id, dto);
  }

  @AllowRoles('MASTER', 'SUPERVISOR')
  @Delete('pet-species/:id')
  deletePetSpecies(@Param('id', ParseIntPipe) id: number) {
    return this.settings.deletePetSpecies(id);
  }
}


