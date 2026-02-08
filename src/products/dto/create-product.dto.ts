import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsObject,
  IsBoolean,
  Min,
} from 'class-validator';
import { ProductType } from '../../common/enums/product-status.enum';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  quantity?: number = 0;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean = true;
}