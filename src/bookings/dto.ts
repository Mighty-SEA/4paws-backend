import { IsArray, IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  ownerId!: number;

  @IsInt()
  serviceTypeId!: number;

  @IsArray()
  petIds!: number[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}


