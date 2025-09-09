import { IsArray, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductUsageItemDto {
  @IsString()
  productName!: string;

  @IsNumberString()
  quantity!: string; // decimal as string
}

export class CreateExaminationDto {
  @IsOptional()
  @IsNumberString()
  weight?: string;

  @IsOptional()
  @IsNumberString()
  temperature?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUsageItemDto)
  products!: ProductUsageItemDto[];
}


