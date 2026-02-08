import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
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
  VendorListing,
} from './dto/search-result.dto';
import { ProductStatus } from '../common/enums/product-status.enum';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(CatalogItem.name) private catalogModel: Model<CatalogItem>,
  ) {}

  async search(dto: SearchDto): Promise<SearchResults> {
    const startTime = Date.now();
    
    // Set default searchType if not provided
    const searchType = dto.searchType || SearchType.ALL;
    
    const results: SearchResults = {
      query: dto.query,
      searchType: searchType.toString(), // Convert to string
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
        const [products, shops] = await Promise.all([
          this.searchProducts(dto),
          this.searchShops(dto),
        ]);
        results.products = products;
        results.shops = shops;
        results.productComparison = await this.getProductComparison(dto);
        break;
    }

    // Get available filters
    results.availableFilters = await this.getAvailableFilters(dto);
    
    results.meta.took = Date.now() - startTime;
    return results;
  }

  async searchProducts(dto: SearchDto): Promise<{
    items: ProductSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [];

    // Match stage
    const matchStage: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
    };

    // Text search
    if (dto.query) {
      matchStage.$text = { $search: dto.query };
    }

    // Location filters
    if (dto.stateId) matchStage.stateId = dto.stateId;
    if (dto.areaId) matchStage.areaId = dto.areaId;
    if (dto.marketId) matchStage.marketId = dto.marketId;

    // Category filters
    if (dto.category) matchStage.category = dto.category;
    if (dto.subcategory) matchStage.subcategory = dto.subcategory;
    if (dto.brand) matchStage.brand = { $regex: dto.brand, $options: 'i' };

    // Price filters
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      matchStage.price = {};
      if (dto.minPrice !== undefined) matchStage.price.$gte = dto.minPrice;
      if (dto.maxPrice !== undefined) matchStage.price.$lte = dto.maxPrice;
    }

    // Stock filter
    if (dto.inStock !== undefined) {
      matchStage.inStock = dto.inStock;
    }

    // Geo query
    if (dto.longitude && dto.latitude) {
      matchStage.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [dto.longitude, dto.latitude],
          },
          $maxDistance: (dto.maxDistance || 10) * 1000,
        },
      };
    }

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

    // Filter by verified vendors if requested
    if (dto.verifiedOnly) {
      pipeline.push({ $match: { 'vendor.isVerified': true } });
    }

    // Lookup state
    pipeline.push({
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: '_id',
        as: 'state',
      },
    });
    pipeline.push({ $unwind: { path: '$state', preserveNullAndEmptyArrays: true } });

    // Lookup area
    pipeline.push({
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'area',
      },
    });
    pipeline.push({ $unwind: { path: '$area', preserveNullAndEmptyArrays: true } });

    // Lookup market
    pipeline.push({
      $lookup: {
        from: 'markets',
        localField: 'marketId',
        foreignField: '_id',
        as: 'market',
      },
    });
    pipeline.push({ $unwind: { path: '$market', preserveNullAndEmptyArrays: true } });

    // Add text score if text search
    if (dto.query) {
      pipeline.push({
        $addFields: {
          textScore: { $meta: 'textScore' },
        },
      });
    }

    // Sort
    const sortStage: any = {};
    switch (dto.sortBy) {
      case SortBy.PRICE_LOW:
        sortStage.price = 1;
        break;
      case SortBy.PRICE_HIGH:
        sortStage.price = -1;
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
        if (dto.query) {
          sortStage.textScore = -1;
        }
        sortStage.createdAt = -1;
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.productModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project final shape
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

    const products = await this.productModel.aggregate(pipeline);

    // Update search appearances
    const productIds = products.map((p) => p.id);
    await this.productModel.updateMany(
      { _id: { $in: productIds } },
      { $inc: { searchAppearances: 1 } },
    );

    return {
      items: products as ProductSearchResult[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductComparison(dto: SearchDto): Promise<{
    items: ProductWithVendors[];
    total: number;
  }> {
    // Group products by name/sku to show price comparison across vendors
    const pipeline: PipelineStage[] = [];

    const matchStage: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
    };

    if (dto.query) {
      matchStage.$or = [
        { name: { $regex: dto.query, $options: 'i' } },
        { $text: { $search: dto.query } },
      ];
    }

    if (dto.stateId) matchStage.stateId = dto.stateId;
    if (dto.areaId) matchStage.areaId = dto.areaId;
    if (dto.marketId) matchStage.marketId = dto.marketId;
    if (dto.category) matchStage.category = dto.category;

    pipeline.push({ $match: matchStage });

    // Lookup vendor details
    pipeline.push({
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    });
    pipeline.push({ $unwind: '$vendor' });

    // Lookup location details
    pipeline.push({
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: '_id',
        as: 'state',
      },
    });
    pipeline.push({ $unwind: { path: '$state', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'area',
      },
    });
    pipeline.push({ $unwind: { path: '$area', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'markets',
        localField: 'marketId',
        foreignField: '_id',
        as: 'market',
      },
    });
    pipeline.push({ $unwind: { path: '$market', preserveNullAndEmptyArrays: true } });

    // Group by product name (or sku/barcode if available)
    pipeline.push({
      $group: {
        _id: {
          $cond: [
            { $ne: ['$sku', null] },
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

    // Sort vendors within each product by price
    pipeline.push({
      $addFields: {
        vendors: {
          $sortArray: {
            input: '$vendors',
            sortBy: { price: 1 },
          },
        },
      },
    });

    // Sort products by number of vendors (popularity)
    pipeline.push({ $sort: { totalVendors: -1 } });

    // Limit
    pipeline.push({ $limit: 20 });

    // Project final shape
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

    const results = await this.productModel.aggregate(pipeline);

    return {
      items: results as ProductWithVendors[],
      total: results.length,
    };
  }

  async searchShops(dto: ShopSearchDto): Promise<{
    items: ShopSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [];

    const matchStage: Record<string, any> = {
      isActive: true,
    };

    // Text search
    if (dto.query) {
      matchStage.$or = [
        { businessName: { $regex: dto.query, $options: 'i' } },
        { businessDescription: { $regex: dto.query, $options: 'i' } },
        { categories: { $in: [new RegExp(dto.query, 'i')] } },
        { tags: { $in: [new RegExp(dto.query, 'i')] } },
      ];
    }

    // Location filters
    if (dto.stateId) matchStage.stateId = dto.stateId;
    if (dto.areaId) matchStage.areaId = dto.areaId;
    if (dto.marketId) matchStage.marketId = dto.marketId;

    // Vendor type
    if (dto.vendorType) matchStage.vendorType = dto.vendorType;

    // Verified only
    if (dto.verifiedOnly) matchStage.isVerified = true;

    // Is open
    if (dto.isOpen !== undefined) matchStage.isOpen = dto.isOpen;

    // Category filter
    if (dto.category) {
      matchStage.categories = { $in: [dto.category] };
    }

    // Geo query
    if (dto.longitude && dto.latitude) {
      matchStage.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [dto.longitude, dto.latitude],
          },
          $maxDistance: (dto.maxDistance || 10) * 1000,
        },
      };
    }

    pipeline.push({ $match: matchStage });

    // Lookup state
    pipeline.push({
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: '_id',
        as: 'state',
      },
    });
    pipeline.push({ $unwind: { path: '$state', preserveNullAndEmptyArrays: true } });

    // Lookup area
    pipeline.push({
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'area',
      },
    });
    pipeline.push({ $unwind: { path: '$area', preserveNullAndEmptyArrays: true } });

    // Lookup market
    pipeline.push({
      $lookup: {
        from: 'markets',
        localField: 'marketId',
        foreignField: '_id',
        as: 'market',
      },
    });
    pipeline.push({ $unwind: { path: '$market', preserveNullAndEmptyArrays: true } });

    // Lookup featured products
    pipeline.push({
      $lookup: {
        from: 'products',
        let: { vendorId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$vendorId', '$$vendorId'] },
              isActive: true,
              status: 'approved',
            },
          },
          { $sort: { views: -1 } },
          { $limit: 4 },
          {
            $project: {
              id: '$_id',
              name: 1,
              price: 1,
              image: { $arrayElemAt: ['$images', 0] },
            },
          },
        ],
        as: 'featuredProducts',
      },
    });

    // Sort
    const sortStage: any = {};
    switch (dto.sortBy) {
      case SortBy.RATING:
        sortStage.rating = -1;
        break;
      case SortBy.POPULARITY:
        sortStage.totalViews = -1;
        break;
      case SortBy.NEWEST:
        sortStage.createdAt = -1;
        break;
      default:
        sortStage.isFeatured = -1;
        sortStage.isVerified = -1;
        sortStage.rating = -1;
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Count total
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.vendorModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project final shape
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
        priceRange: {
          min: '$minProductPrice',
          max: '$maxProductPrice',
        },
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
          shopNumber: 1,
          shopFloor: 1,
          shopBlock: 1,
          shopAddress: 1,
          landmark: 1,
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

    const shops = await this.vendorModel.aggregate(pipeline);

    // Update search appearances
    const vendorIds = shops.map((s) => s.id);
    await this.vendorModel.updateMany(
      { _id: { $in: vendorIds } },
      { $inc: { searchAppearances: 1 } },
    );

    return {
      items: shops as ShopSearchResult[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAvailableFilters(dto: SearchDto): Promise<{
    states: { id: string; name: string; count: number }[];
    areas: { id: string; name: string; count: number }[];
    markets: { id: string; name: string; count: number }[];
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  }> {
    const matchStage: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
    };

    if (dto.query) {
      matchStage.$or = [
        { name: { $regex: dto.query, $options: 'i' } },
        { description: { $regex: dto.query, $options: 'i' } },
      ];
    }

    // States
    const statesAgg = await this.productModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'states',
          localField: 'stateId',
          foreignField: '_id',
          as: 'state',
        },
      },
      { $unwind: '$state' },
      {
        $group: {
          _id: '$state._id',
          name: { $first: '$state.name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          id: '$_id',
          name: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Areas (filtered by state if provided)
    const areasMatch = { ...matchStage };
    if (dto.stateId) areasMatch.stateId = dto.stateId;

    const areasAgg = await this.productModel.aggregate([
      { $match: areasMatch },
      {
        $lookup: {
          from: 'areas',
          localField: 'areaId',
          foreignField: '_id',
          as: 'area',
        },
      },
      { $unwind: '$area' },
      {
        $group: {
          _id: '$area._id',
          name: { $first: '$area.name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          id: '$_id',
          name: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Markets (filtered by area if provided)
    const marketsMatch = { ...matchStage };
    if (dto.stateId) marketsMatch.stateId = dto.stateId;
    if (dto.areaId) marketsMatch.areaId = dto.areaId;

    const marketsAgg = await this.productModel.aggregate([
      { $match: { ...marketsMatch, marketId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'markets',
          localField: 'marketId',
          foreignField: '_id',
          as: 'market',
        },
      },
      { $unwind: '$market' },
      {
        $group: {
          _id: '$market._id',
          name: { $first: '$market.name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          id: '$_id',
          name: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Categories
    const categoriesAgg = await this.productModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Brands
    const brandsAgg = await this.productModel.aggregate([
      { $match: { ...matchStage, brand: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Price range
    const priceAgg = await this.productModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          min: { $min: '$price' },
          max: { $max: '$price' },
        },
      },
    ]);

    return {
      states: statesAgg,
      areas: areasAgg,
      markets: marketsAgg,
      categories: categoriesAgg,
      brands: brandsAgg,
      priceRange: priceAgg[0] || { min: 0, max: 0 },
    };
  }

  async getProductVendors(productName: string, filters: SearchDto): Promise<ProductWithVendors> {
    const pipeline: PipelineStage[] = [];

    const matchStage: Record<string, any> = {
      isActive: true,
      status: ProductStatus.APPROVED,
      $or: [
        { name: { $regex: productName, $options: 'i' } },
        { sku: productName },
        { barcode: productName },
      ],
    };

    if (filters.stateId) matchStage.stateId = filters.stateId;
    if (filters.areaId) matchStage.areaId = filters.areaId;
    if (filters.marketId) matchStage.marketId = filters.marketId;
    if (filters.minPrice !== undefined) {
      matchStage.price = { ...matchStage.price, $gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
      matchStage.price = { ...matchStage.price, $lte: filters.maxPrice };
    }

    pipeline.push({ $match: matchStage });

    // Full vendor lookup with all details
    pipeline.push({
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    });
    pipeline.push({ $unwind: '$vendor' });

    // Location lookups
    pipeline.push({
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: '_id',
        as: 'state',
      },
    });
    pipeline.push({ $unwind: { path: '$state', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'area',
      },
    });
    pipeline.push({ $unwind: { path: '$area', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'markets',
        localField: 'marketId',
        foreignField: '_id',
        as: 'market',
      },
    });
    pipeline.push({ $unwind: { path: '$market', preserveNullAndEmptyArrays: true } });

    // Group to get all vendors
    pipeline.push({
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
    });

    // Sort vendors by price
    pipeline.push({
      $addFields: {
        vendors: {
          $sortArray: {
            input: '$vendors',
            sortBy: { price: 1 },
          },
        },
      },
    });

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

    const result = await this.productModel.aggregate(pipeline);
    return result[0] as ProductWithVendors;
  }

  async getShopProducts(
    vendorId: string,
    filters: { category?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number },
  ): Promise<{
    shop: ShopSearchResult;
    products: ProductSearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Get shop details
    const shopPipeline: PipelineStage[] = [
      { $match: { _id: vendorId } },
      {
        $lookup: {
          from: 'states',
          localField: 'stateId',
          foreignField: '_id',
          as: 'state',
        },
      },
      { $unwind: { path: '$state', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'areas',
          localField: 'areaId',
          foreignField: '_id',
          as: 'area',
        },
      },
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'markets',
          localField: 'marketId',
          foreignField: '_id',
          as: 'market',
        },
      },
      { $unwind: { path: '$market', preserveNullAndEmptyArrays: true } },
    ];

    const shopResult = await this.vendorModel.aggregate(shopPipeline);
    const shop = shopResult[0];

    // Get products
    const productMatch: Record<string, any> = {
      vendorId: vendorId,
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
      this.productModel
        .find(productMatch)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.productModel.countDocuments(productMatch),
    ]);

    return {
      shop: shop as ShopSearchResult,
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        images: p.images || [],
        price: p.price,
        originalPrice: p.originalPrice,
        currency: p.currency,
        inStock: p.inStock,
        vendor: {
          id: shop._id.toString(),
          businessName: shop.businessName,
          logo: shop.shopImages?.logo,
          rating: shop.rating,
          isVerified: shop.isVerified,
          contactDetails: {
            phone: shop.contactDetails?.phone,
            whatsapp: shop.contactDetails?.whatsapp,
          },
        },
        location: {
          state: { id: shop.state?._id?.toString(), name: shop.state?.name },
          area: { id: shop.area?._id?.toString(), name: shop.area?.name },
          market: { id: shop.market?._id?.toString(), name: shop.market?.name, type: shop.market?.type },
          shopNumber: shop.shopNumber,
          shopAddress: shop.shopAddress,
        },
      })) as ProductSearchResult[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSimilarProducts(productId: string, limit: number = 10): Promise<ProductSearchResult[]> {
    const product = await this.productModel.findById(productId);
    if (!product) return [];

    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: { $ne: product._id },
          category: product.category,
          isActive: true,
          status: ProductStatus.APPROVED,
        },
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $lookup: {
          from: 'states',
          localField: 'stateId',
          foreignField: '_id',
          as: 'state',
        },
      },
      { $unwind: { path: '$state', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'areas',
          localField: 'areaId',
          foreignField: '_id',
          as: 'area',
        },
      },
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      { $sample: { size: limit } },
      {
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
          },
        },
      },
    ];

    return this.productModel.aggregate(pipeline);
  }
}