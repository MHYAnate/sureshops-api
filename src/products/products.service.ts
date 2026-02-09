import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { VendorsService } from '../vendors/vendors.service';
import { CatalogService } from '../catalog/catalog.service';
import { ProductStatus } from '../common/enums/product-status.enum';

// ✅ Helper to validate location object
function isValidLocation(location: any): boolean {
  return (
    location &&
    location.type === 'Point' &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    typeof location.coordinates[0] === 'number' &&
    typeof location.coordinates[1] === 'number'
  );
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private vendorsService: VendorsService,
    private catalogService: CatalogService,
  ) {}

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    // Get vendor by user
    const vendor = await this.vendorsService.findByUser(userId);

    // Try to match with catalog item
    let catalogItemId: Types.ObjectId | undefined;
    if (dto.sku) {
      const catalogItem = await this.catalogService.findBySku(dto.sku);
      if (catalogItem) catalogItemId = catalogItem._id as Types.ObjectId;
    } else if (dto.barcode) {
      const catalogItem = await this.catalogService.findByBarcode(dto.barcode);
      if (catalogItem) catalogItemId = catalogItem._id as Types.ObjectId;
    }

    // Build create data
    const createData: Record<string, any> = {
      ...dto,
      vendorId: vendor._id,
      stateId: vendor.stateId,
      areaId: vendor.areaId,
      marketId: vendor.marketId,
      status: ProductStatus.APPROVED,
    };

    // ✅ Only copy location if vendor has valid coordinates
    if (isValidLocation(vendor.location)) {
      createData.location = {
        type: 'Point',
        coordinates: vendor.location!.coordinates,
      };
    }
    // ✅ Do NOT set location at all if vendor doesn't have valid coordinates

    // Add catalog item ID if matched
    if (catalogItemId) {
      createData.catalogItemId = catalogItemId;
    }

    const product = await this.productModel.create(createData);

    // Increment vendor product count and update price range
    await this.vendorsService.incrementProductCount(vendor._id.toString());
    await this.updateVendorPriceRange(vendor._id.toString());

    // Update catalog price stats if linked
    if (catalogItemId) {
      await this.updateCatalogPriceStats(catalogItemId.toString());
    }

    return product;
  }

  async findAll(filterDto: FilterProductDto): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      vendorId,
      category,
      subcategory,
      type,
      status,
      search,
      minPrice,
      maxPrice,
      stateId,
      areaId,
      marketId,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const query: Record<string, any> = { isActive: true };

    // ✅ Convert all ref IDs to ObjectId
    if (vendorId) query.vendorId = new Types.ObjectId(vendorId);
    if (stateId) query.stateId = new Types.ObjectId(stateId);
    if (areaId) query.areaId = new Types.ObjectId(areaId);
    if (marketId) query.marketId = new Types.ObjectId(marketId);
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = ProductStatus.APPROVED;
    if (inStock !== undefined) query.inStock = inStock;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate({
          path: 'vendorId',
          select: 'businessName shopImages contactDetails bankDetails stateId areaId marketId shopNumber rating isVerified',
          populate: [
            { path: 'stateId', select: 'name' },
            { path: 'areaId', select: 'name' },
            { path: 'marketId', select: 'name type' },
          ],
        })
        .skip(skip)
        .limit(limit)
        .sort(sortOptions),
      this.productModel.countDocuments(query),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate({
        path: 'vendorId',
        select: 'businessName businessDescription shopImages contactDetails bankDetails stateId areaId marketId shopNumber shopFloor shopBlock shopAddress landmark rating isVerified operatingHours isOpen',
        populate: [
          { path: 'stateId', select: 'name code' },
          { path: 'areaId', select: 'name' },
          { path: 'marketId', select: 'name type address entrancePhoto layoutMap' },
        ],
      });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productModel.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return product;
  }

  async findByVendor(vendorId: string): Promise<Product[]> {
    return this.productModel
      .find({ vendorId: new Types.ObjectId(vendorId), isActive: true })
      .sort({ createdAt: -1 });
  }

  async getMyProducts(userId: string): Promise<Product[]> {
    const vendor = await this.vendorsService.findByUser(userId);
    return this.productModel
      .find({ vendorId: vendor._id })
      .sort({ createdAt: -1 });
  }

  async findNearby(
    longitude: number,
    latitude: number,
    maxDistanceKm: number = 5,
    category?: string,
  ): Promise<Product[]> {
    const query: Record<string, any> = {
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
      status: ProductStatus.APPROVED,
    };

    if (category) query.category = category;

    return this.productModel
      .find(query)
      .populate({
        path: 'vendorId',
        select: 'businessName shopImages contactDetails rating isVerified shopNumber',
      })
      .limit(50);
  }

  async update(id: string, dto: UpdateProductDto, userId: string): Promise<Product> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify ownership
    const vendor = await this.vendorsService.findByUser(userId);
    if (product.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenException('You can only update your own products');
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    // Update vendor price range if price changed
    if (dto.price !== undefined) {
      await this.updateVendorPriceRange(vendor._id.toString());
    }

    // Update catalog price stats if linked
    if (product.catalogItemId) {
      await this.updateCatalogPriceStats(product.catalogItemId.toString());
    }

    return updatedProduct;
  }

  async adminUpdate(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async delete(id: string, userId: string): Promise<void> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify ownership
    const vendor = await this.vendorsService.findByUser(userId);
    if (product.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productModel.deleteOne({ _id: id });

    // Decrement vendor product count
    await this.vendorsService.decrementProductCount(vendor._id.toString());
    await this.updateVendorPriceRange(vendor._id.toString());

    // Update catalog price stats if linked
    if (product.catalogItemId) {
      await this.updateCatalogPriceStats(product.catalogItemId.toString());
    }
  }

  private async updateVendorPriceRange(vendorId: string): Promise<void> {
    const priceStats = await this.productModel.aggregate([
      {
        $match: {
          vendorId: new Types.ObjectId(vendorId),
          isActive: true,
          status: ProductStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    if (priceStats.length > 0) {
      await this.vendorsService.updatePriceRange(
        vendorId,
        priceStats[0].minPrice,
        priceStats[0].maxPrice,
      );
    }
  }

  private async updateCatalogPriceStats(catalogItemId: string): Promise<void> {
    const prices = await this.productModel
      .find({
        catalogItemId: new Types.ObjectId(catalogItemId),
        isActive: true,
        status: ProductStatus.APPROVED,
      })
      .select('price');

    const priceValues = prices.map((p) => p.price);
    await this.catalogService.updatePriceStats(catalogItemId, priceValues);
  }
}