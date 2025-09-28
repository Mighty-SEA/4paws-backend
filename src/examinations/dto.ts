import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductUsageItemDto {
  @IsOptional()
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsString()
  quantity!: string;
}

class MixComponentDto {
  @IsInt()
  productId!: number;

  @IsString()
  quantity!: string;
}

class MixItemDto {
  @IsOptional()
  @IsString()
  mixName?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MixComponentDto)
  components!: MixComponentDto[];
}

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  temperature?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  prognosis?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  doctorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  paravetId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groomerId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUsageItemDto)
  products?: ProductUsageItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MixItemDto)
  mixes?: MixItemDto[];
}