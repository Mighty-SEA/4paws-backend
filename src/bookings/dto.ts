import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { BookingItemRole } from '@prisma/client';

export class CreateBookingDto {
  @IsInt()
  ownerId!: number;

  @IsInt()
  serviceTypeId!: number;

  @IsOptional()
  @IsArray()
  petIds?: number[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SplitBookingDto {
  @IsArray()
  @IsInt({ each: true })
  petIds!: number[];
}

export class CreateBookingItemDto {
  @IsInt()
  serviceTypeId!: number;

  @IsOptional()
  @IsEnum(BookingItemRole)
  role?: BookingItemRole;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}


