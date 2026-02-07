import { IsOptional, IsString, IsEnum, IsNumber, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { MarketType } from '../../common/enums/market-type.enum';

export class FilterMarketDto {
  @IsOptional()
  @IsMongoId()
  stateId?: string;

  @IsOptional()
  @IsMongoId()
  areaId?: string;

  @IsOptional()
  @IsEnum(MarketType)
  type?: MarketType;

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
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}