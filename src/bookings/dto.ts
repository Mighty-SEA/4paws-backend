import { IsArray, IsDateString, IsInt, IsOptional } from 'class-validator';

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

export class SplitBookingDto {
  @IsArray()
  @IsInt({ each: true })
  petIds!: number[];
}


