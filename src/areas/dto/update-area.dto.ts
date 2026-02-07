import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class UpdateAreaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}