// src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Product } from '../products/schemas/product.schema';
import { Vendor } from '../vendors/schemas/vendor.schema';
import { CatalogItem } from '../catalog/schemas/catalog-item.schema';
import {
  SearchDto,
  ProductSearchDto,
  ShopSearchDto,
  SearchType,
  SortBy,
} from './dto/search.dto';
import {
  SearchResults,
  ProductSearchResult,
  ShopSearchResult,
  ProductWithVendors,
} from './dto/search-result.dto';
import { ProductStatus } from '../common/enums/product-status.enum';

// Helper: safely convert to ObjectId, returns null if invalid
function toObjectId(id: string | undefined): Types.ObjectId | null {
  if (!id) return null;
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(CatalogItem.name) private catalogModel: Model<CatalogItem>,
  ) {}

  async search(dto: SearchDto): Promise<SearchResults> {
    const startTime = Date.now();
    const searchType = dto.searchType || SearchType.ALL;

    const results: SearchResults = {
      query: dto.query,
      searchType: searchType.toString(),
      availableFilters: {
        states: [],
        areas: [],
        markets: [],
        categories: [],
        brands: [],
        priceRange: { min: 0, max: 0 },
      },
      meta: {
        timestamp: new Date().toISOString(),
        took: 0,
      },
    };

    try {
      switch (searchType) {
        case SearchType.PRODUCTS:
          results.products = await this.searchProducts(dto);
          results.productComparison = await this.getProductComparison(dto);
          break;
        case SearchType.SHOPS:
          results.shops = await this.searchShops(dto);
          break;
        case SearchType.ALL:
        default:
          const [products, shops, productComparison] = await Promise.all([
            this.searchProducts(dto),
            this.searchShops(dto),
            this.getProductComparison(dto),
          ]);
          results.products = products;
          results.shops = shops;
          results.productComparison = productComparison;
          break;
      }

      results.availableFilters = await this.getAvailableFilters(dto);
    } catch (error) {
      console.error('Search error:', error.message, error.stack);
      throw error;
    }

    results.meta.took = Date.now() - startTime;
    return results;
  }

  // Build match query for products — shared between search and filters
  private buildProductMatch(dto: SearchDto): Record<string, any> {
    const match: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
    };

    if (dto.query) {
      match.$or = [
        { name: { $regex: dto.query, $options: 'i' } },
        { description: { $regex: dto.query, $options: 'i' } },
        { brand: { $regex: dto.query, $options: 'i' } },
        { tags: { $in: [new RegExp(dto.query, 'i')] } },
      ];
    }

    if (dto.category) match.category = dto.category;
    if (dto.subcategory) match.subcategory = dto.subcategory;
    if (dto.brand) match.brand = { $regex: dto.brand, $options: 'i' };

    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      match.price = {};
      if (dto.minPrice !== undefined) match.price.$gte = Number(dto.minPrice);
      if (dto.maxPrice !== undefined) match.price.$lte = Number(dto.maxPrice);
    }

    if (dto.inStock !== undefined) match.inStock = dto.inStock;

    // Location filters — handle both string and ObjectId stored values
    if (dto.stateId) {
      const oid = toObjectId(dto.stateId);
      if (oid) {
        match.$and = [
          ...(match.$and || []),
          {
            $or: [
              { stateId: oid },
              { stateId: dto.stateId },
            ],
          },
        ];
      }
    }

    if (dto.areaId) {
      const oid = toObjectId(dto.areaId);
      if (oid) {
        match.$and = [
          ...(match.$and || []),
          {
            $or: [
              { areaId: oid },
              { areaId: dto.areaId },
            ],
          },
        ];
      }
    }

    if (dto.marketId) {
      const oid = toObjectId(dto.marketId);
      if (oid) {
        match.$and = [
          ...(match.$and || []),
          {
            $or: [
              { marketId: oid },
              { marketId: dto.marketId },
            ],
          },
        ];
      }
    }

    return match;
  }

  async searchProducts(dto: SearchDto): Promise<{
    items: ProductSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;
    const isGeoSearch = !!(dto.longitude && dto.latitude);

    const pipeline: PipelineStage[] = [];

    // $geoNear MUST be first
    if (isGeoSearch) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(dto.longitude), Number(dto.latitude)],
          },
          distanceField: 'distance',
          maxDistance: (dto.maxDistance || 10) * 1000,
          spherical: true,
          query: {
            isActive: true,
            status: ProductStatus.APPROVED,
          },
        },
      });
    }

    // Build match
    const matchStage = isGeoSearch
      ? (() => {
          // For geo search, base filters already in $geoNear query
          // Add remaining filters here
          const m: Record<string, any> = {};
          if (dto.query) {
            m.$or = [
              { name: { $regex: dto.query, $options: 'i' } },
              { description: { $regex: dto.query, $options: 'i' } },
              { brand: { $regex: dto.query, $options: 'i' } },
              { tags: { $in: [new RegExp(dto.query, 'i')] } },
            ];
          }
          if (dto.category) m.category = dto.category;
          if (dto.subcategory) m.subcategory = dto.subcategory;
          if (dto.brand) m.brand = { $regex: dto.brand, $options: 'i' };
          if (dto.inStock !== undefined) m.inStock = dto.inStock;
          if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
            m.price = {};
            if (dto.minPrice !== undefined) m.price.$gte = Number(dto.minPrice);
            if (dto.maxPrice !== undefined) m.price.$lte = Number(dto.maxPrice);
          }
          return m;
        })()
      : this.buildProductMatch(dto);

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Lookup vendor
    pipeline.push({
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    });
    pipeline.push({ $unwind: '$vendor' });

    // Filter vendors — use $ne false instead of === true
    // This way undefined/missing isActive still passes
    const vendorMatch: Record<string, any> = {
      'vendor.isActive': { $ne: false },
    };
    if (dto.verifiedOnly) {
      vendorMatch['vendor.isVerified'] = true;
    }
    pipeline.push({ $match: vendorMatch });

    // Lookup state
    pipeline.push({
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: '_id',
        as: 'state',
      },
    });
    pipeline.push({
      $unwind: { path: '$state', preserveNullAndEmptyArrays: true },
    });

    // Lookup area
    pipeline.push({
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'area',
      },
    });
    pipeline.push({
      $unwind: { path: '$area', preserveNullAndEmptyArrays: true },
    });

    // Lookup market
    pipeline.push({
      $lookup: {
        from: 'markets',
        localField: 'marketId',
        foreignField: '_id',
        as: 'market',
      },
    });
    pipeline.push({
      $unwind: { path: '$market', preserveNullAndEmptyArrays: true },
    });

    // Sort
    const sortStage: Record<string, 1 | -1> = {};
    switch (dto.sortBy) {
      case SortBy.PRICE_LOW:
        sortStage.price = 1;
        break;
      case SortBy.PRICE_HIGH:
        sortStage.price = -1;
        break;
      case SortBy.DISTANCE:
        if (isGeoSearch) sortStage.distance = 1;
        else sortStage.createdAt = -1;
        break;
      case SortBy.RATING:
        sortStage['vendor.rating'] = -1;
        break;
      case SortBy.NEWEST:
        sortStage.createdAt = -1;
        break;
      case SortBy.POPULARITY:
        sortStage.views = -1;
        break;
      case SortBy.RELEVANCE:
      default:
        if (isGeoSearch) sortStage.distance = 1;
        sortStage.views = -1;
        sortStage.createdAt = -1;
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.productModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Paginate
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project
    pipeline.push({
      $project: {
        id: '$_id',
        name: 1,
        description: 1,
        brand: 1,
        category: 1,
        subcategory: 1,
        images: 1,
        price: 1,
        originalPrice: 1,
        currency: 1,
        inStock: 1,
        distance: isGeoSearch ? 1 : '$$REMOVE',
        vendor: {
          id: '$vendor._id',
          businessName: '$vendor.businessName',
          logo: '$vendor.shopImages.logo',
          rating: '$vendor.rating',
          isVerified: '$vendor.isVerified',
          contactDetails: {
            phone: '$vendor.contactDetails.phone',
            whatsapp: '$vendor.contactDetails.whatsapp',
          },
        },
        location: {
          state: { id: '$state._id', name: '$state.name' },
          area: { id: '$area._id', name: '$area.name' },
          market: {
            id: '$market._id',
            name: '$market.name',
            type: '$market.type',
          },
          shopNumber: '$vendor.shopNumber',
          shopAddress: '$vendor.shopAddress',
          coordinates: '$location.coordinates',
        },
      },
    });

    try {
      const products = await this.productModel.aggregate(pipeline);

      // Update search appearances
      if (products.length > 0) {
        const productIds = products.map((p) => p.id);
        await this.productModel.updateMany(
          { _id: { $in: productIds } },
          { $inc: { searchAppearances: 1 } },
        );
      }

      return {
        items: products as ProductSearchResult[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('searchProducts pipeline error:', error.message, error.stack);
      return { items: [], total: 0, page, totalPages: 0 };
    }
  }

  async getProductComparison(dto: SearchDto): Promise<{
    items: ProductWithVendors[];
    total: number;
  }> {
    const pipeline: PipelineStage[] = [];

    const matchStage = this.buildProductMatch(dto);
    pipeline.push({ $match: matchStage });

    // Lookup vendor
    pipeline.push({
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    });
    pipeline.push({ $unwind: '$vendor' });
    pipeline.push({ $match: { 'vendor.isActive': { $ne: false } } });

    // Lookup locations
    pipeline.push({
      $lookup: { from: 'states', localField: 'stateId', foreignField: '_id', as: 'state' },
    });
    pipeline.push({ $unwind: { path: '$state', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' },
    });
    pipeline.push({ $unwind: { path: '$area', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: { from: 'markets', localField: 'marketId', foreignField: '_id', as: 'market' },
    });
    pipeline.push({ $unwind: { path: '$market', preserveNullAndEmptyArrays: true } });

    // Group by product
    pipeline.push({
      $group: {
        _id: {
          $cond: [
            { $and: [{ $ne: ['$sku', null] }, { $ne: ['$sku', ''] }] },
            '$sku',
            { $toLower: '$name' },
          ],
        },
        name: { $first: '$name' },
        description: { $first: '$description' },
        brand: { $first: '$brand' },
        category: { $first: '$category' },
        subcategory: { $first: '$subcategory' },
        images: { $first: '$images' },
        catalogItemId: { $first: '$catalogItemId' },
        lowestPrice: { $min: '$price' },
        highestPrice: { $max: '$price' },
        averagePrice: { $avg: '$price' },
        totalVendors: { $sum: 1 },
        vendors: {
          $push: {
            vendorId: '$vendor._id',
            productId: '$_id',
            businessName: '$vendor.businessName',
            logo: '$vendor.shopImages.logo',
            entrancePhoto: '$vendor.shopImages.entrancePhoto',
            rating: '$vendor.rating',
            isVerified: '$vendor.isVerified',
            price: '$price',
            originalPrice: '$originalPrice',
            inStock: '$inStock',
            quantity: '$quantity',
            contactDetails: '$vendor.contactDetails',
            bankDetails: '$vendor.bankDetails',
            location: {
              state: { id: '$state._id', name: '$state.name' },
              area: { id: '$area._id', name: '$area.name' },
              market: { id: '$market._id', name: '$market.name', type: '$market.type' },
              shopNumber: '$vendor.shopNumber',
              shopFloor: '$vendor.shopFloor',
              shopBlock: '$vendor.shopBlock',
              shopAddress: '$vendor.shopAddress',
              landmark: '$vendor.landmark',
              coordinates: '$vendor.location.coordinates',
            },
            operatingHours: {
              openingTime: '$vendor.operatingHours.openingTime',
              closingTime: '$vendor.operatingHours.closingTime',
              operatingDays: '$vendor.operatingHours.operatingDays',
              isOpen: '$vendor.isOpen',
            },
          },
        },
      },
    });

    pipeline.push({
      $addFields: {
        vendors: { $sortArray: { input: '$vendors', sortBy: { price: 1 } } },
      },
    });

    pipeline.push({ $sort: { totalVendors: -1 } });
    pipeline.push({ $limit: 20 });

    pipeline.push({
      $project: {
        id: '$_id',
        catalogItemId: 1,
        name: 1,
        description: 1,
        brand: 1,
        category: 1,
        subcategory: 1,
        images: 1,
        priceRange: {
          lowest: '$lowestPrice',
          highest: '$highestPrice',
          average: { $round: ['$averagePrice', 2] },
          currency: 'NGN',
        },
        totalVendors: 1,
        vendors: 1,
      },
    });

    try {
      const results = await this.productModel.aggregate(pipeline);
      return { items: results as ProductWithVendors[], total: results.length };
    } catch (error) {
      console.error('Product comparison error:', error.message);
      return { items: [], total: 0 };
    }
  }

  async searchShops(dto: ShopSearchDto): Promise<{
    items: ShopSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;
    const isGeoSearch = !!(dto.longitude && dto.latitude);

    const pipeline: PipelineStage[] = [];

    if (isGeoSearch) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(dto.longitude), Number(dto.latitude)] },
          distanceField: 'distance',
          maxDistance: (dto.maxDistance || 10) * 1000,
          spherical: true,
          query: { isActive: { $ne: false } },
        },
      });
    }

    const matchStage: Record<string, any> = {};
    if (!isGeoSearch) matchStage.isActive = { $ne: false };

    if (dto.query) {
      matchStage.$or = [
        { businessName: { $regex: dto.query, $options: 'i' } },
        { businessDescription: { $regex: dto.query, $options: 'i' } },
        { categories: { $in: [new RegExp(dto.query, 'i')] } },
        { tags: { $in: [new RegExp(dto.query, 'i')] } },
      ];
    }

    if (dto.stateId) {
      const oid = toObjectId(dto.stateId);
      if (oid) matchStage.$and = [...(matchStage.$and || []), { $or: [{ stateId: oid }, { stateId: dto.stateId }] }];
    }
    if (dto.areaId) {
      const oid = toObjectId(dto.areaId);
      if (oid) matchStage.$and = [...(matchStage.$and || []), { $or: [{ areaId: oid }, { areaId: dto.areaId }] }];
    }
    if (dto.marketId) {
      const oid = toObjectId(dto.marketId);
      if (oid) matchStage.$and = [...(matchStage.$and || []), { $or: [{ marketId: oid }, { marketId: dto.marketId }] }];
    }

    if (dto.vendorType) matchStage.vendorType = dto.vendorType;
    if (dto.verifiedOnly) matchStage.isVerified = true;
    if (dto.isOpen !== undefined) matchStage.isOpen = dto.isOpen;
    if (dto.category) matchStage.categories = { $in: [dto.category] };

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Lookups
    pipeline.push({ $lookup: { from: 'states', localField: 'stateId', foreignField: '_id', as: 'state' } });
    pipeline.push({ $unwind: { path: '$state', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } });
    pipeline.push({ $unwind: { path: '$area', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $lookup: { from: 'markets', localField: 'marketId', foreignField: '_id', as: 'market' } });
    pipeline.push({ $unwind: { path: '$market', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'products',
        let: { vendorId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$vendorId', '$$vendorId'] }, isActive: true, status: ProductStatus.APPROVED } },
          { $sort: { views: -1 } },
          { $limit: 4 },
          { $project: { id: '$_id', name: 1, price: 1, image: { $arrayElemAt: ['$images', 0] } } },
        ],
        as: 'featuredProducts',
      },
    });

    // Sort
    const sortStage: Record<string, 1 | -1> = {};
    switch (dto.sortBy) {
      case SortBy.RATING: sortStage.rating = -1; break;
      case SortBy.POPULARITY: sortStage.totalViews = -1; break;
      case SortBy.NEWEST: sortStage.createdAt = -1; break;
      case SortBy.DISTANCE:
        if (isGeoSearch) sortStage.distance = 1;
        else sortStage.createdAt = -1;
        break;
      default:
        if (isGeoSearch) sortStage.distance = 1;
        sortStage.isFeatured = -1;
        sortStage.isVerified = -1;
        sortStage.rating = -1;
        break;
    }
    pipeline.push({ $sort: sortStage });

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.vendorModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    pipeline.push({
      $project: {
        id: '$_id',
        businessName: 1,
        businessDescription: 1,
        vendorType: 1,
        logo: '$shopImages.logo',
        entrancePhoto: '$shopImages.entrancePhoto',
        layoutMap: '$shopImages.layoutMap',
        rating: 1,
        reviewCount: 1,
        totalProducts: 1,
        isVerified: 1,
        isFeatured: 1,
        categories: 1,
        distance: isGeoSearch ? 1 : '$$REMOVE',
        priceRange: { min: '$minProductPrice', max: '$maxProductPrice' },
        contactDetails: {
          phone: '$contactDetails.phone',
          whatsapp: '$contactDetails.whatsapp',
          email: '$contactDetails.email',
          instagram: '$contactDetails.instagram',
        },
        bankDetails: 1,
        location: {
          state: { id: '$state._id', name: '$state.name' },
          area: { id: '$area._id', name: '$area.name' },
          market: { id: '$market._id', name: '$market.name', type: '$market.type' },
          shopNumber: 1, shopFloor: 1, shopBlock: 1, shopAddress: 1, landmark: 1,
          coordinates: '$location.coordinates',
        },
        operatingHours: {
          openingTime: '$operatingHours.openingTime',
          closingTime: '$operatingHours.closingTime',
          operatingDays: '$operatingHours.operatingDays',
          isOpen: 1,
        },
        featuredProducts: 1,
      },
    });

    try {
      const shops = await this.vendorModel.aggregate(pipeline);
      if (shops.length > 0) {
        const vendorIds = shops.map((s) => s.id);
        await this.vendorModel.updateMany({ _id: { $in: vendorIds } }, { $inc: { searchAppearances: 1 } });
      }
      return { items: shops as ShopSearchResult[], total, page, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      console.error('searchShops error:', error.message);
      return { items: [], total: 0, page, totalPages: 0 };
    }
  }

  async getAvailableFilters(dto: SearchDto): Promise<{
    states: { id: string; name: string; count: number }[];
    areas: { id: string; name: string; count: number }[];
    markets: { id: string; name: string; count: number }[];
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  }> {
    // Base match — same as search but WITHOUT location filters
    // so we show what locations are available
    const baseMatch: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
    };

    if (dto.query) {
      baseMatch.$or = [
        { name: { $regex: dto.query, $options: 'i' } },
        { description: { $regex: dto.query, $options: 'i' } },
        { brand: { $regex: dto.query, $options: 'i' } },
        { tags: { $in: [new RegExp(dto.query, 'i')] } },
      ];
    }

    if (dto.category) baseMatch.category = dto.category;

    try {
      // Run all filter aggregations in parallel
      const [statesAgg, areasAgg, marketsAgg, categoriesAgg, brandsAgg, priceAgg] =
        await Promise.all([
          // States — use $addFields to convert stateId for lookup
          this.productModel.aggregate([
            { $match: baseMatch },
            {
              $addFields: {
                stateOid: {
                  $cond: {
                    if: { $eq: [{ $type: '$stateId' }, 'objectId'] },
                    then: '$stateId',
                    else: { $toObjectId: '$stateId' },
                  },
                },
              },
            },
            { $lookup: { from: 'states', localField: 'stateOid', foreignField: '_id', as: 'state' } },
            { $unwind: { path: '$state', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$state._id', name: { $first: '$state.name' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
            { $project: { id: '$_id', name: 1, count: 1, _id: 0 } },
          ]),

          // Areas
          (() => {
            const areaMatch = { ...baseMatch };
            if (dto.stateId) {
              const oid = toObjectId(dto.stateId);
              if (oid) {
                areaMatch.$and = [...(areaMatch.$and || []), { $or: [{ stateId: oid }, { stateId: dto.stateId }] }];
              }
            }
            return this.productModel.aggregate([
              { $match: areaMatch },
              {
                $addFields: {
                  areaOid: {
                    $cond: {
                      if: { $eq: [{ $type: '$areaId' }, 'objectId'] },
                      then: '$areaId',
                      else: { $toObjectId: '$areaId' },
                    },
                  },
                },
              },
              { $lookup: { from: 'areas', localField: 'areaOid', foreignField: '_id', as: 'area' } },
              { $unwind: { path: '$area', preserveNullAndEmptyArrays: false } },
              { $group: { _id: '$area._id', name: { $first: '$area.name' }, count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 20 },
              { $project: { id: '$_id', name: 1, count: 1, _id: 0 } },
            ]);
          })(),

          // Markets
          (() => {
            const marketMatch: Record<string, any> = {
              ...baseMatch,
              marketId: { $exists: true, $ne: null },
            };
            if (dto.stateId) {
              const oid = toObjectId(dto.stateId);
              if (oid) {
                marketMatch.$and = [...(marketMatch.$and || []), { $or: [{ stateId: oid }, { stateId: dto.stateId }] }];
              }
            }
            if (dto.areaId) {
              const oid = toObjectId(dto.areaId);
              if (oid) {
                marketMatch.$and = [...(marketMatch.$and || []), { $or: [{ areaId: oid }, { areaId: dto.areaId }] }];
              }
            }
            return this.productModel.aggregate([
              { $match: marketMatch },
              {
                $addFields: {
                  marketOid: {
                    $cond: {
                      if: { $eq: [{ $type: '$marketId' }, 'objectId'] },
                      then: '$marketId',
                      else: { $toObjectId: '$marketId' },
                    },
                  },
                },
              },
              { $lookup: { from: 'markets', localField: 'marketOid', foreignField: '_id', as: 'market' } },
              { $unwind: { path: '$market', preserveNullAndEmptyArrays: false } },
              { $group: { _id: '$market._id', name: { $first: '$market.name' }, count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 20 },
              { $project: { id: '$_id', name: 1, count: 1, _id: 0 } },
            ]);
          })(),

          // Categories
          this.productModel.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
            { $project: { name: '$_id', count: 1, _id: 0 } },
          ]),

          // Brands
          this.productModel.aggregate([
            { $match: { ...baseMatch, brand: { $exists: true, $nin: [null, ''] } } },
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
            { $project: { name: '$_id', count: 1, _id: 0 } },
          ]),

          // Price range
          this.productModel.aggregate([
            { $match: baseMatch },
            { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
          ]),
        ]);

      return {
        states: statesAgg,
        areas: areasAgg,
        markets: marketsAgg,
        categories: categoriesAgg,
        brands: brandsAgg,
        priceRange: priceAgg[0] ? { min: priceAgg[0].min, max: priceAgg[0].max } : { min: 0, max: 0 },
      };
    } catch (error) {
      console.error('Filter aggregation error:', error.message, error.stack);
      return { states: [], areas: [], markets: [], categories: [], brands: [], priceRange: { min: 0, max: 0 } };
    }
  }

  async getProductVendors(productName: string, filters: SearchDto): Promise<ProductWithVendors> {
    const matchStage: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
      $or: [
        { name: { $regex: productName, $options: 'i' } },
        { sku: productName },
        { barcode: productName },
      ],
    };

    if (filters.stateId) {
      const oid = toObjectId(filters.stateId);
      if (oid) matchStage.$and = [...(matchStage.$and || []), { $or: [{ stateId: oid }, { stateId: filters.stateId }] }];
    }
    if (filters.areaId) {
      const oid = toObjectId(filters.areaId);
      if (oid) matchStage.$and = [...(matchStage.$and || []), { $or: [{ areaId: oid }, { areaId: filters.areaId }] }];
    }
    if (filters.marketId) {
      const oid = toObjectId(filters.marketId);
      if (oid) matchStage.$and = [...(matchStage.$and || []), { $or: [{ marketId: oid }, { marketId: filters.marketId }] }];
    }
    if (filters.minPrice !== undefined) matchStage.price = { ...(matchStage.price || {}), $gte: filters.minPrice };
    if (filters.maxPrice !== undefined) matchStage.price = { ...(matchStage.price || {}), $lte: filters.maxPrice };

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      { $lookup: { from: 'vendors', localField: 'vendorId', foreignField: '_id', as: 'vendor' } },
      { $unwind: '$vendor' },
      { $match: { 'vendor.isActive': { $ne: false } } },
      { $lookup: { from: 'states', localField: 'stateId', foreignField: '_id', as: 'state' } },
      { $unwind: { path: '$state', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'markets', localField: 'marketId', foreignField: '_id', as: 'market' } },
      { $unwind: { path: '$market', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $toLower: '$name' },
          name: { $first: '$name' },
          description: { $first: '$description' },
          brand: { $first: '$brand' },
          category: { $first: '$category' },
          subcategory: { $first: '$subcategory' },
          images: { $first: '$images' },
          catalogItemId: { $first: '$catalogItemId' },
          lowestPrice: { $min: '$price' },
          highestPrice: { $max: '$price' },
          averagePrice: { $avg: '$price' },
          totalVendors: { $sum: 1 },
          vendors: {
            $push: {
              vendorId: '$vendor._id',
              productId: '$_id',
              businessName: '$vendor.businessName',
              logo: '$vendor.shopImages.logo',
              entrancePhoto: '$vendor.shopImages.entrancePhoto',
              rating: '$vendor.rating',
              isVerified: '$vendor.isVerified',
              price: '$price',
              originalPrice: '$originalPrice',
              inStock: '$inStock',
              quantity: '$quantity',
              contactDetails: '$vendor.contactDetails',
              bankDetails: '$vendor.bankDetails',
              location: {
                state: { id: '$state._id', name: '$state.name' },
                area: { id: '$area._id', name: '$area.name' },
                market: { id: '$market._id', name: '$market.name', type: '$market.type' },
                shopNumber: '$vendor.shopNumber',
                shopFloor: '$vendor.shopFloor',
                shopBlock: '$vendor.shopBlock',
                shopAddress: '$vendor.shopAddress',
                landmark: '$vendor.landmark',
                coordinates: '$vendor.location.coordinates',
              },
              operatingHours: {
                openingTime: '$vendor.operatingHours.openingTime',
                closingTime: '$vendor.operatingHours.closingTime',
                operatingDays: '$vendor.operatingHours.operatingDays',
                isOpen: '$vendor.isOpen',
              },
            },
          },
        },
      },
      { $addFields: { vendors: { $sortArray: { input: '$vendors', sortBy: { price: 1 } } } } },
      {
        $project: {
          id: '$_id', catalogItemId: 1, name: 1, description: 1, brand: 1,
          category: 1, subcategory: 1, images: 1,
          priceRange: {
            lowest: '$lowestPrice', highest: '$highestPrice',
            average: { $round: ['$averagePrice', 2] }, currency: 'NGN',
          },
          totalVendors: 1, vendors: 1,
        },
      },
    ];

    const result = await this.productModel.aggregate(pipeline);
    return result[0] as ProductWithVendors;
  }

  async getShopProducts(
    vendorId: string,
    filters: { category?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number },
  ): Promise<{ shop: ShopSearchResult; products: ProductSearchResult[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const shopPipeline: PipelineStage[] = [
      { $match: { _id: new Types.ObjectId(vendorId) } },
      { $lookup: { from: 'states', localField: 'stateId', foreignField: '_id', as: 'state' } },
      { $unwind: { path: '$state', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'markets', localField: 'marketId', foreignField: '_id', as: 'market' } },
      { $unwind: { path: '$market', preserveNullAndEmptyArrays: true } },
    ];

    const shopResult = await this.vendorModel.aggregate(shopPipeline);
    const shop = shopResult[0];

    if (!shop) {
      return { shop: null as any, products: [], total: 0, page, totalPages: 0 };
    }

    const productMatch: Record<string, any> = {
      vendorId: new Types.ObjectId(vendorId),
      isActive: true,
      status: ProductStatus.APPROVED,
    };
    if (filters.category) productMatch.category = filters.category;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      productMatch.price = {};
      if (filters.minPrice !== undefined) productMatch.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) productMatch.price.$lte = filters.maxPrice;
    }

    const [products, total] = await Promise.all([
      this.productModel.find(productMatch).skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.productModel.countDocuments(productMatch),
    ]);

    return {
      shop: shop as ShopSearchResult,
      products: products.map((p) => ({
        id: p._id.toString(), name: p.name, description: p.description, brand: p.brand,
        category: p.category, subcategory: p.subcategory, images: p.images || [],
        price: p.price, originalPrice: p.originalPrice, currency: p.currency, inStock: p.inStock,
        vendor: {
          id: shop._id.toString(), businessName: shop.businessName,
          logo: shop.shopImages?.logo, rating: shop.rating, isVerified: shop.isVerified,
          contactDetails: { phone: shop.contactDetails?.phone, whatsapp: shop.contactDetails?.whatsapp },
        },
        location: {
          state: { id: shop.state?._id?.toString(), name: shop.state?.name },
          area: { id: shop.area?._id?.toString(), name: shop.area?.name },
          market: { id: shop.market?._id?.toString(), name: shop.market?.name, type: shop.market?.type },
          shopNumber: shop.shopNumber, shopAddress: shop.shopAddress,
        },
      })) as ProductSearchResult[],
      total, page, totalPages: Math.ceil(total / limit),
    };
  }

  async getSimilarProducts(productId: string, limit: number = 10): Promise<ProductSearchResult[]> {
    try {
      const product = await this.productModel.findById(productId);
      if (!product) return [];

      const pipeline: PipelineStage[] = [
        { $match: { _id: { $ne: product._id }, category: product.category, isActive: true, status: ProductStatus.APPROVED } },
        { $lookup: { from: 'vendors', localField: 'vendorId', foreignField: '_id', as: 'vendor' } },
        { $unwind: '$vendor' },
        { $lookup: { from: 'states', localField: 'stateId', foreignField: '_id', as: 'state' } },
        { $unwind: { path: '$state', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
        { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
        { $sample: { size: limit } },
        {
          $project: {
            id: '$_id', name: 1, description: 1, brand: 1, category: 1, subcategory: 1,
            images: 1, price: 1, originalPrice: 1, currency: 1, inStock: 1,
            vendor: {
              id: '$vendor._id', businessName: '$vendor.businessName',
              logo: '$vendor.shopImages.logo', rating: '$vendor.rating',
              isVerified: '$vendor.isVerified',
              contactDetails: { phone: '$vendor.contactDetails.phone', whatsapp: '$vendor.contactDetails.whatsapp' },
            },
            location: {
              state: { id: '$state._id', name: '$state.name' },
              area: { id: '$area._id', name: '$area.name' },
            },
          },
        },
      ];

      return this.productModel.aggregate(pipeline);
    } catch (error) {
      console.error('Similar products error:', error.message);
      return [];
    }
  }
}