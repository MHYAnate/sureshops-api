import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { VendorsService } from '../vendors/vendors.service';
import { ProductStatus } from '../common/enums/product-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private vendorsService: VendorsService,
  ) {}

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    // Get vendor by user
    const vendor = await this.vendorsService.findByUser(userId);
    
    const product = await this.productModel.create({
      ...dto,
      vendorId: vendor._id,
      status: ProductStatus.PENDING,
    });

    // Increment vendor product count
    await this.vendorsService.incrementProductCount(vendor._id.toString());

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
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const query: Record<string, any> = { isActive: true };

    if (vendorId) query.vendorId = vendorId;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = ProductStatus.APPROVED; // Default to approved

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate({
          path: 'vendorId',
          select: 'businessName shopImages contactDetails stateId areaId marketId',
          populate: [
            { path: 'stateId', select: 'name' },
            { path: 'areaId', select: 'name' },
            { path: 'marketId', select: 'name' },
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
        select: 'businessName businessDescription shopImages contactDetails bankDetails stateId areaId marketId',
        populate: [
          { path: 'stateId', select: 'name code' },
          { path: 'areaId', select: 'name' },
          { path: 'marketId', select: 'name type address' },
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
      .find({ vendorId, isActive: true })
      .sort({ createdAt: -1 });
  }

  async getMyProducts(userId: string): Promise<Product[]> {
    const vendor = await this.vendorsService.findByUser(userId);
    return this.productModel
      .find({ vendorId: vendor._id })
      .sort({ createdAt: -1 });
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
      throw new NotFoundException('Product not found after update');
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
  }
}