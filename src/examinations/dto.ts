import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductUsageItemDto {
  @IsString()
  productName!: string;

  @IsString()
  quantity!: string; // allow decimal string values
}

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  weight?: string; // allow decimal string values

  @IsOptional()
  @IsString()
  temperature?: string; // allow decimal string values

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUsageItemDto)
  products!: ProductUsageItemDto[];
}


