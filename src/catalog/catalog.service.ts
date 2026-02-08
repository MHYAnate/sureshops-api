import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItem } from './schemas/catalog-item.schema';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { FilterCatalogDto } from './dto/filter-catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(CatalogItem.name) private catalogModel: Model<CatalogItem>,
  ) {}

  async create(dto: CreateCatalogItemDto): Promise<CatalogItem> {
    // Check for duplicates
    const exists = await this.catalogModel.findOne({
      $or: [
        { sku: dto.sku },
        { barcode: dto.barcode },
        { name: { $regex: `^${dto.name}$`, $options: 'i' } },
      ],
    });

    if (exists) {
      throw new ConflictException('Catalog item already exists');
    }

    return this.catalogModel.create(dto);
  }

  async findAll(filterDto: FilterCatalogDto): Promise<{
    items: CatalogItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, search, category, subcategory, brand } = filterDto;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { alternateNames: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = { $regex: brand, $options: 'i' };

    const [items, total] = await Promise.all([
      this.catalogModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ totalListings: -1, name: 1 }),
      this.catalogModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<CatalogItem> {
    const item = await this.catalogModel.findById(id);
    if (!item) {
      throw new NotFoundException('Catalog item not found');
    }
    return item;
  }

  async findBySku(sku: string): Promise<CatalogItem | null> {
    return this.catalogModel.findOne({ sku });
  }

  async findByBarcode(barcode: string): Promise<CatalogItem | null> {
    return this.catalogModel.findOne({ barcode });
  }

  async searchByName(name: string): Promise<CatalogItem[]> {
    return this.catalogModel.find({
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { alternateNames: { $in: [new RegExp(name, 'i')] } },
      ],
      isActive: true,
    }).limit(10);
  }

  async updatePriceStats(catalogItemId: string, prices: number[]): Promise<void> {
    if (prices.length === 0) return;

    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    await this.catalogModel.findByIdAndUpdate(catalogItemId, {
      lowestPrice,
      highestPrice,
      averagePrice: Math.round(averagePrice * 100) / 100,
      totalListings: prices.length,
    });
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    return this.catalogModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
  }

  async getBrands(category?: string): Promise<{ brand: string; count: number }[]> {
    const match: Record<string, any> = { isActive: true, brand: { $exists: true, $ne: null } };
    if (category) match.category = category;

    return this.catalogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
      {
        $project: {
          brand: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
  }
}