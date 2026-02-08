import { IsOptional, IsString, IsEnum, IsNumber, IsMongoId, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchType {
  PRODUCTS = 'products',
  SHOPS = 'shops',
  ALL = 'all',
}

export enum SortBy {
  RELEVANCE = 'relevance',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
  RATING = 'rating',
  NEWEST = 'newest',
  DISTANCE = 'distance',
  POPULARITY = 'popularity',
}

export class SearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(SearchType)
  searchType?: SearchType = SearchType.ALL;

  // Location Filters
  @IsOptional()
  @IsMongoId()
  stateId?: string;

  @IsOptional()
  @IsMongoId()
  areaId?: string;

  @IsOptional()
  @IsMongoId()
  marketId?: string;

  // Geolocation
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
  maxDistance?: number = 10; // in km

  // Category Filters
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  // Price Filters
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  // Other Filters
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Sorting
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RELEVANCE;

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}

export class ProductSearchDto extends SearchDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class ShopSearchDto extends SearchDto {
  @IsOptional()
  @IsEnum(['market_shop', 'mall_shop', 'home_based', 'street_shop', 'online_only'])
  vendorType?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOpen?: boolean;
}