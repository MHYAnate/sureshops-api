import { IsString, IsNumber, IsOptional, IsEnum, IsMongoId, Min, Max, IsArray } from 'class-validator';
import { ReviewType } from '../schemas/review.schema';

export class CreateReviewDto {
  @IsEnum(ReviewType)
  type: ReviewType;

  @IsMongoId()
  @IsOptional()
  productId?: string;

  @IsMongoId()
  @IsOptional()
  vendorId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}