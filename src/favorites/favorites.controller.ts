import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto, ToggleFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoriteType } from './schemas/favorite.schema';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  getUserFavorites(@Request() req, @Query('type') type?: FavoriteType) {
    return this.favoritesService.getUserFavorites(req.user.id, type);
  }

  @Get('products')
  getFavoriteProducts(@Request() req) {
    return this.favoritesService.getFavoriteProducts(req.user.id);
  }

  @Get('vendors')
  getFavoriteVendors(@Request() req) {
    return this.favoritesService.getFavoriteVendors(req.user.id);
  }

  @Get('count')
  getFavoriteCount(@Request() req) {
    return this.favoritesService.getFavoriteCount(req.user.id);
  }

  @Get('check/:type/:itemId')
  checkIsFavorite(
    @Request() req,
    @Param('type') type: FavoriteType,
    @Param('itemId') itemId: string,
  ) {
    return this.favoritesService.isFavorite(req.user.id, type, itemId);
  }

  @Post('check-multiple')
  checkMultipleFavorites(
    @Request() req,
    @Body() items: { type: FavoriteType; itemId: string }[],
  ) {
    return this.favoritesService.checkFavorites(req.user.id, items);
  }

  @Post()
  addFavorite(@Request() req, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.addFavorite(req.user.id, dto);
  }

  @Post('toggle')
  toggleFavorite(@Request() req, @Body() dto: ToggleFavoriteDto) {
    return this.favoritesService.toggleFavorite(req.user.id, dto);
  }

  @Delete(':type/:itemId')
  removeFavorite(
    @Request() req,
    @Param('type') type: FavoriteType,
    @Param('itemId') itemId: string,
  ) {
    return this.favoritesService.removeFavorite(req.user.id, type, itemId);
  }
}