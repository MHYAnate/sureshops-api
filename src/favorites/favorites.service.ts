import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite, FavoriteType } from './schemas/favorite.schema';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<Favorite>,
  ) {}

  async addFavorite(userId: string, dto: CreateFavoriteDto): Promise<Favorite> {
    const existing = await this.favoriteModel.findOne({
      userId,
      type: dto.type,
      itemId: dto.itemId,
    });

    if (existing) {
      return existing;
    }

    const favoriteData: any = {
      userId,
      type: dto.type,
      itemId: dto.itemId,
    };

    if (dto.type === FavoriteType.PRODUCT) {
      favoriteData.productId = dto.itemId;
    } else {
      favoriteData.vendorId = dto.itemId;
    }

    return this.favoriteModel.create(favoriteData);
  }

  async removeFavorite(userId: string, type: FavoriteType, itemId: string): Promise<void> {
    await this.favoriteModel.deleteOne({ userId, type, itemId });
  }

  async toggleFavorite(userId: string, dto: CreateFavoriteDto): Promise<{ isFavorite: boolean }> {
    const existing = await this.favoriteModel.findOne({
      userId,
      type: dto.type,
      itemId: dto.itemId,
    });

    if (existing) {
      await this.favoriteModel.deleteOne({ _id: existing._id });
      return { isFavorite: false };
    }

    await this.addFavorite(userId, dto);
    return { isFavorite: true };
  }

  async getUserFavorites(
    userId: string,
    type?: FavoriteType,
  ): Promise<Favorite[]> {
    const query: any = { userId };
    if (type) query.type = type;

    return this.favoriteModel
      .find(query)
      .populate({
        path: 'productId',
        select: 'name price images category vendorId',
        populate: {
          path: 'vendorId',
          select: 'businessName shopImages',
        },
      })
      .populate({
        path: 'vendorId',
        select: 'businessName businessDescription shopImages rating totalProducts',
      })
      .sort({ createdAt: -1 });
  }

  async getFavoriteProducts(userId: string): Promise<Favorite[]> {
    return this.getUserFavorites(userId, FavoriteType.PRODUCT);
  }

  async getFavoriteVendors(userId: string): Promise<Favorite[]> {
    return this.getUserFavorites(userId, FavoriteType.VENDOR);
  }

  async isFavorite(userId: string, type: FavoriteType, itemId: string): Promise<boolean> {
    const count = await this.favoriteModel.countDocuments({ userId, type, itemId });
    return count > 0;
  }

  async checkFavorites(
    userId: string,
    items: { type: FavoriteType; itemId: string }[],
  ): Promise<{ [key: string]: boolean }> {
    const favorites = await this.favoriteModel.find({
      userId,
      $or: items.map((item) => ({ type: item.type, itemId: item.itemId })),
    });

    const result: { [key: string]: boolean } = {};
    items.forEach((item) => {
      const key = `${item.type}_${item.itemId}`;
      result[key] = favorites.some(
        (f) => f.type === item.type && f.itemId.toString() === item.itemId,
      );
    });

    return result;
  }

  async getFavoriteCount(userId: string): Promise<{ products: number; vendors: number }> {
    const [products, vendors] = await Promise.all([
      this.favoriteModel.countDocuments({ userId, type: FavoriteType.PRODUCT }),
      this.favoriteModel.countDocuments({ userId, type: FavoriteType.VENDOR }),
    ]);
    return { products, vendors };
  }
}