import { IsString, IsOptional, IsArray, IsNumber, IsMongoId } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  stateId: string;

  @IsString()
  @IsOptional()
  localGovernment?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];

  @IsString()
  @IsOptional()
  postalCode?: string;
}