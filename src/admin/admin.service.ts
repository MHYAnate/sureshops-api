import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/schemas/user.schema';
import { Vendor } from '../vendors/schemas/vendor.schema';
import { Product } from '../products/schemas/product.schema';
import { State } from '../states/schemas/state.schema';
import { Area } from '../areas/schemas/area.schema';
import { Market } from '../markets/schemas/market.schema';
import { Role } from '../common/enums/role.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { AdminUpdateUserDto, AdminCreateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdateVendorDto, AdminVendorActionDto } from './dto/admin-update-vendor.dto';
import { AdminUpdateProductDto, AdminProductActionDto } from './dto/admin-update-product.dto';
import { DashboardStats, RecentActivity } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(State.name) private stateModel: Model<State>,
    @InjectModel(Area.name) private areaModel: Model<Area>,
    @InjectModel(Market.name) private marketModel: Model<Market>,
  ) {}

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole,
      totalVendors,
      verifiedVendors,
      pendingVendors,
      featuredVendors,
      newVendorsThisMonth,
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      newProductsThisMonth,
      totalStates,
      totalAreas,
      totalMarkets,
      totalViews,
      totalSearches,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.userModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      this.vendorModel.countDocuments(),
      this.vendorModel.countDocuments({ isVerified: true }),
      this.vendorModel.countDocuments({ isVerified: false, isActive: true }),
      this.vendorModel.countDocuments({ isFeatured: true }),
      this.vendorModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.productModel.countDocuments(),
      this.productModel.countDocuments({ status: ProductStatus.APPROVED }),
      this.productModel.countDocuments({ status: ProductStatus.PENDING }),
      this.productModel.countDocuments({ status: ProductStatus.REJECTED }),
      this.productModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.stateModel.countDocuments(),
      this.areaModel.countDocuments(),
      this.marketModel.countDocuments(),
      this.vendorModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalViews' } } },
      ]),
      this.productModel.aggregate([
        { $group: { _id: null, total: { $sum: '$searchAppearances' } } },
      ]),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        byRole: usersByRole.map((r) => ({ role: r._id, count: r.count })),
      },
      vendors: {
        total: totalVendors,
        verified: verifiedVendors,
        pending: pendingVendors,
        featured: featuredVendors,
        newThisMonth: newVendorsThisMonth,
      },
      products: {
        total: totalProducts,
        approved: approvedProducts,
        pending: pendingProducts,
        rejected: rejectedProducts,
        newThisMonth: newProductsThisMonth,
      },
      locations: {
        states: totalStates,
        areas: totalAreas,
        markets: totalMarkets,
      },
      activity: {
        totalViews: totalViews[0]?.total || 0,
        totalSearches: totalSearches[0]?.total || 0,
      },
    };
  }

  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const [recentUsers, recentVendors, recentProducts] = await Promise.all([
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('firstName lastName email createdAt'),
      this.vendorModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('businessName isVerified createdAt'),
      this.productModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name status createdAt'),
    ]);

    const activities: RecentActivity[] = [];

    recentUsers.forEach((user) => {
      activities.push({
        type: 'user_registered',
        message: `New user registered: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt as any,
        data: { userId: user._id, email: user.email },
      });
    });

    recentVendors.forEach((vendor) => {
      activities.push({
        type: vendor.isVerified ? 'vendor_verified' : 'vendor_created',
        message: vendor.isVerified
          ? `Vendor verified: ${vendor.businessName}`
          : `New vendor created: ${vendor.businessName}`,
        timestamp: vendor.createdAt as any,
        data: { vendorId: vendor._id },
      });
    });

    recentProducts.forEach((product) => {
      activities.push({
        type: 'product_added',
        message: `New product added: ${product.name}`,
        timestamp: product.createdAt as any,
        data: { productId: product._id, status: product.status },
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, limit);
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(filters: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
    isActive?: boolean;
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, role, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(dto: AdminCreateUserDto): Promise<User> {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return this.userModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });
  }

  async updateUser(id: string, dto: AdminUpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException('User not found');
  }

  async changeUserRole(id: string, role: Role): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ==================== VENDOR MANAGEMENT ====================

  async getAllVendors(filters: {
    page?: number;
    limit?: number;
    isVerified?: boolean;
    isFeatured?: boolean;
    search?: string;
  }): Promise<{ vendors: Vendor[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, isVerified, isFeatured, search } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      this.vendorModel
        .find(query)
        .populate('userId', 'firstName lastName email')
        .populate('stateId', 'name')
        .populate('areaId', 'name')
        .populate('marketId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.vendorModel.countDocuments(query),
    ]);

    return {
      vendors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVendorById(id: string): Promise<Vendor> {
    const vendor = await this.vendorModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone')
      .populate('stateId', 'name')
      .populate('areaId', 'name')
      .populate('marketId', 'name');
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateVendor(id: string, dto: AdminUpdateVendorDto): Promise<Vendor> {
    const vendor = await this.vendorModel.findByIdAndUpdate(id, dto, { new: true });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async vendorAction(id: string, dto: AdminVendorActionDto): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updates: any = {};

    switch (dto.action) {
      case 'approve':
        updates.isVerified = true;
        updates.isActive = true;
        break;
      case 'reject':
        updates.isVerified = false;
        updates.isActive = false;
        break;
      case 'suspend':
        updates.isActive = false;
        break;
      case 'feature':
        updates.isFeatured = true;
        break;
      case 'unfeature':
        updates.isFeatured = false;
        break;
    }

    const updated = await this.vendorModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) throw new NotFoundException('Vendor not found');
    return updated;
  }

  async getPendingVendors(): Promise<Vendor[]> {
    return this.vendorModel
      .find({ isVerified: false, isActive: true })
      .populate('userId', 'firstName lastName email')
      .populate('stateId', 'name')
      .populate('areaId', 'name')
      .sort({ createdAt: -1 });
  }

  // ==================== PRODUCT MANAGEMENT ====================

  async getAllProducts(filters: {
    page?: number;
    limit?: number;
    status?: ProductStatus;
    search?: string;
    vendorId?: string;
  }): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, status, search, vendorId } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate({
          path: 'vendorId',
          select: 'businessName isVerified',
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.productModel.countDocuments(query),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('vendorId');
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: AdminUpdateProductDto): Promise<Product> {
    const product = await this.productModel.findByIdAndUpdate(id, dto, { new: true });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async productAction(id: string, dto: AdminProductActionDto): Promise<Product> {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    const updates: any = {};

    switch (dto.action) {
      case 'approve':
        updates.status = ProductStatus.APPROVED;
        break;
      case 'reject':
        updates.status = ProductStatus.REJECTED;
        break;
      case 'flag':
        updates.status = ProductStatus.PENDING;
        break;
      case 'delete':
        await this.productModel.deleteOne({ _id: id });
        return product;
    }
    const updated = await this.productModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async getPendingProducts(): Promise<Product[]> {
    return this.productModel
      .find({ status: ProductStatus.PENDING })
      .populate('vendorId', 'businessName')
      .sort({ createdAt: -1 });
  }

  async bulkApproveProducts(ids: string[]): Promise<number> {
    const result = await this.productModel.updateMany(
      { _id: { $in: ids } },
      { status: ProductStatus.APPROVED },
    );
    return result.modifiedCount;
  }

  async bulkRejectProducts(ids: string[], reason?: string): Promise<number> {
    const result = await this.productModel.updateMany(
      { _id: { $in: ids } },
      { status: ProductStatus.REJECTED },
    );
    return result.modifiedCount;
  }
}