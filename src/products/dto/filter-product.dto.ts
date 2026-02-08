import { IsOptional, IsString, IsEnum, IsNumber, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductType } from '../../common/enums/product-status.enum';

export class FilterProductDto {
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  // Location filters
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
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}