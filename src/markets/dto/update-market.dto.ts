import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { MarketType } from '../../common/enums/market-type.enum';

export class UpdateMarketDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MarketType)
  @IsOptional()
  type?: MarketType;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];

  @IsString()
  @IsOptional()
  entrancePhoto?: string;

  @IsString()
  @IsOptional()
  layoutMap?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalPhotos?: string[];

  @IsString()
  @IsOptional()
  openingTime?: string;

  @IsString()
  @IsOptional()
  closingTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  operatingDays?: string[];

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}