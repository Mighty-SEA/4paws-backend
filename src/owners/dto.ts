import { IsDateString, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOwnerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  address!: string;
}

export class CreatePetDto {
  @IsInt()
  ownerId!: number;

  @IsString()
  name!: string;

  @IsString()
  species!: string;

  @IsString()
  breed!: string;

  @IsDateString()
  birthdate!: string;
}

export class OwnerIdParamDto {
  @IsInt()
  id!: number;
}


