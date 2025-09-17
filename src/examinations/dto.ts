import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUsageItemDto)
  products!: ProductUsageItemDto[];
}


