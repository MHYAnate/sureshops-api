import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsMongoId,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { MarketType } from '../../common/enums/market-type.enum';

export class CreateMarketDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MarketType)
  type: MarketType;

  @IsMongoId()
  stateId: string;

  @IsMongoId()
  areaId: string;

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
}