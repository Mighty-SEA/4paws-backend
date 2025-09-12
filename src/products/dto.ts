import { IsEnum, IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  unit!: string; // e.g., botol, kaplet

  @IsOptional()
  @IsNumberString()
  price?: string;

  // optional content info, e.g., 100 ml per botol; 20 tablet per kaplet
  @IsOptional()
  @IsNumberString()
  unitContentAmount?: string;

  @IsOptional()
  @IsString()
  unitContentName?: string;
}

export class CreateUnitDto {
  // removed (no longer used)
}

export enum InventoryTypeDto {
  IN = 'IN',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class AddInventoryDto {
  @IsInt()
  productId!: number;

  @IsNumberString()
  quantity!: string; // base unit quantity

  @IsEnum(InventoryTypeDto)
  type!: InventoryTypeDto;

  @IsOptional()
  @IsString()
  note?: string;
}


