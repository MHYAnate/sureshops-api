import { IsEnum, IsMongoId } from 'class-validator';
import { FavoriteType } from '../schemas/favorite.schema';

export class CreateFavoriteDto {
  @IsEnum(FavoriteType)
  type: FavoriteType;

  @IsMongoId()
  itemId: string;
}

export class ToggleFavoriteDto {
  @IsEnum(FavoriteType)
  type: FavoriteType;

  @IsMongoId()
  itemId: string;
}