import { IsOptional, IsString, IsEnum, IsNumber, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { VendorType } from '../../common/enums/vendor-type.enum';

export class FilterVendorDto {
  @IsOptional()
  @IsMongoId()
  stateId?: string;

  @IsOptional()
  @IsMongoId()
  areaId?: string;

  @IsOptional()
  @IsMongoId()
  marketId?: string;

  @IsOptional()
  @IsEnum(VendorType)
  vendorType?: VendorType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDistance?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}