import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class AdminUpdateProductDto {
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class AdminProductActionDto {
  @IsString()
  action: 'approve' | 'reject' | 'flag' | 'delete';

  @IsString()
  @IsOptional()
  reason?: string;
}