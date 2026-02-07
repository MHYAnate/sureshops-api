import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CreateStateDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  capital?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}