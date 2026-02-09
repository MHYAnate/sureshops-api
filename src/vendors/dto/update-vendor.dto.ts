import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsMongoId,
  IsEnum,
  IsObject,
  IsBoolean,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VendorType } from '../../common/enums/vendor-type.enum';

class BankDetailsDto {
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankCode?: string;
}

class ContactDetailsDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  twitter?: string;

  @IsString()
  @IsOptional()
  website?: string;
}

class ShopImagesDto {
  @IsString()
  @IsOptional()
  entrancePhoto?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  layoutMap?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalImages?: string[];
}

class OperatingHoursDto {
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

  @IsBoolean()
  @IsOptional()
  is24Hours?: boolean;
}

export class UpdateVendorDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessDescription?: string;

  @IsEnum(VendorType)
  @IsOptional()
  vendorType?: VendorType;

  @IsMongoId()
  @IsOptional()
  stateId?: string;

  @IsMongoId()
  @IsOptional()
  areaId?: string;

  @IsMongoId()
  @IsOptional()
  marketId?: string;

  @IsString()
  @IsOptional()
  shopNumber?: string;

  @IsString()
  @IsOptional()
  shopFloor?: string;

  @IsString()
  @IsOptional()
  shopBlock?: string;

  @IsString()
  @IsOptional()
  shopAddress?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];

  @IsObject()
  @ValidateNested()
  @Type(() => ShopImagesDto)
  @IsOptional()
  shopImages?: ShopImagesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ContactDetailsDto)
  @IsOptional()
  contactDetails?: ContactDetailsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsOptional()
  bankDetails?: BankDetailsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operatingHours?: OperatingHoursDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}