import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Market } from './schemas/market.schema';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { FilterMarketDto } from './dto/filter-market.dto';

@Injectable()
export class MarketsService {
  constructor(@InjectModel(Market.name) private marketModel: Model<Market>) {}

  async create(dto: CreateMarketDto): Promise<Market> {
    const marketData: any = { ...dto };
    if (dto.coordinates) {
      marketData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete marketData.coordinates;
    return this.marketModel.create(marketData);
  }

  async findAll(filterDto: FilterMarketDto): Promise<{
    markets: Market[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, stateId, areaId, type, search, longitude, latitude, maxDistance } = filterDto;

    // Create a query object with proper typing
    const query: Record<string, any> = { isActive: true };

    if (stateId) query.stateId = stateId;
    if (areaId) query.areaId = areaId;
    if (type) query.type = type;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    // Geospatial query
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: (maxDistance || 10) * 1000,
        },
      };
    }

    const skip = (page - 1) * limit;
    const [markets, total] = await Promise.all([
      this.marketModel
        .find(query)
        .populate('stateId', 'name code')
        .populate('areaId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.marketModel.countDocuments(query),
    ]);

    return {
      markets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Market> {
    const market = await this.marketModel
      .findById(id)
      .populate('stateId', 'name code')
      .populate('areaId', 'name localGovernment');
    if (!market) {
      throw new NotFoundException('Market not found');
    }
    return market;
  }

  async findByArea(areaId: string): Promise<Market[]> {
    return this.marketModel
      .find({ areaId, isActive: true })
      .populate('stateId', 'name code')
      .populate('areaId', 'name')
      .sort({ name: 1 });
  }

  async findNearby(
    longitude: number,
    latitude: number,
    maxDistanceKm: number = 5,
  ): Promise<Market[]> {
    return this.marketModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceKm * 1000,
        },
      },
      isActive: true,
    })
    .populate('stateId', 'name code')
    .populate('areaId', 'name');
  }

  async update(id: string, dto: UpdateMarketDto): Promise<Market> {
    const updateData: any = { ...dto };
    if (dto.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete updateData.coordinates;

    const market = await this.marketModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('stateId', 'name code')
      .populate('areaId', 'name');
    if (!market) {
      throw new NotFoundException('Market not found');
    }
    return market;
  }

  async incrementShopCount(id: string): Promise<void> {
    await this.marketModel.findByIdAndUpdate(id, { $inc: { totalShops: 1 } });
  }

  async decrementShopCount(id: string): Promise<void> {
    await this.marketModel.findByIdAndUpdate(id, { $inc: { totalShops: -1 } });
  }

  async delete(id: string): Promise<void> {
    const result = await this.marketModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Market not found');
    }
  }
}