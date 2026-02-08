import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminUpdateVendorDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class AdminVendorActionDto {
  @IsString()
  action: 'approve' | 'reject' | 'suspend' | 'feature' | 'unfeature';

  @IsString()
  @IsOptional()
  reason?: string;
}