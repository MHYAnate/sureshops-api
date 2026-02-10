// import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Vendor } from './schemas/vendor.schema';
// import { CreateVendorDto } from './dto/create-vendor.dto';
// import { UpdateVendorDto } from './dto/update-vendor.dto';
// import { FilterVendorDto } from './dto/filter-vendor.dto';
// import { MarketsService } from '../markets/markets.service';
// import { UsersService } from '../users/users.service';
// import { Role } from '../common/enums/role.enum';

// @Injectable()
// export class VendorsService {
//   constructor(
//     @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
//     private marketsService: MarketsService,
//     private usersService: UsersService,
//   ) {}

//   async create(dto: CreateVendorDto, userId: string): Promise<Vendor> {
//     const vendorData: any = { ...dto, userId };

//     // ✅ Only set location if valid coordinates are provided
//     if (
//       dto.coordinates &&
//       Array.isArray(dto.coordinates) &&
//       dto.coordinates.length === 2 &&
//       typeof dto.coordinates[0] === 'number' &&
//       typeof dto.coordinates[1] === 'number'
//     ) {
//       vendorData.location = {
//         type: 'Point',
//         coordinates: dto.coordinates,
//       };
//     }
//     // ✅ Always remove coordinates from the data (it's not a schema field)
//     delete vendorData.coordinates;

//     // ✅ Ensure no partial location object exists
//     if (
//       vendorData.location &&
//       (!vendorData.location.coordinates ||
//         !Array.isArray(vendorData.location.coordinates) ||
//         vendorData.location.coordinates.length !== 2)
//     ) {
//       delete vendorData.location;
//     }

//     const vendor = await this.vendorModel.create(vendorData);

//     // Update user role to vendor
//     await this.usersService.update(userId, { role: Role.VENDOR });
//     await this.usersService.updateVendorProfile(userId, vendor._id.toString());

//     // Increment market shop count if applicable
//     if (dto.marketId) {
//       await this.marketsService.incrementShopCount(dto.marketId);
//     }

//     return vendor;
//   }

//   async findAll(filterDto: FilterVendorDto): Promise<{
//     vendors: Vendor[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }> {
//     const {
//       page = 1,
//       limit = 20,
//       stateId,
//       areaId,
//       marketId,
//       vendorType,
//       category,
//       search,
//       longitude,
//       latitude,
//       maxDistance,
//       isVerified,
//       isFeatured,
//     } = filterDto;

//     const query: Record<string, any> = { isActive: true };

//     if (stateId) query.stateId = new Types.ObjectId(stateId);
//     if (areaId) query.areaId = new Types.ObjectId(areaId);
//     if (marketId) query.marketId = new Types.ObjectId(marketId);
//     if (vendorType) query.vendorType = vendorType;
//     if (category) query.categories = { $in: [category] };
//     if (isVerified !== undefined) query.isVerified = isVerified;
//     if (isFeatured !== undefined) query.isFeatured = isFeatured;

//     if (search) {
//       query.$or = [
//         { businessName: { $regex: search, $options: 'i' } },
//         { businessDescription: { $regex: search, $options: 'i' } },
//         { tags: { $in: [new RegExp(search, 'i')] } },
//       ];
//     }

//     if (longitude && latitude) {
//       query.location = {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [longitude, latitude],
//           },
//           $maxDistance: (maxDistance || 10) * 1000,
//         },
//       };
//     }

//     const skip = (page - 1) * limit;
//     const [vendors, total] = await Promise.all([
//       this.vendorModel
//         .find(query)
//         .populate('stateId', 'name code')
//         .populate('areaId', 'name')
//         .populate('marketId', 'name type')
//         .populate('userId', 'firstName lastName email')
//         .skip(skip)
//         .limit(limit)
//         .sort({ isFeatured: -1, rating: -1, createdAt: -1 }),
//       this.vendorModel.countDocuments(query),
//     ]);

//     return {
//       vendors,
//       total,
//       page,
//       totalPages: Math.ceil(total / limit),
//     };
//   }

//   async findById(id: string): Promise<Vendor> {
//     const vendor = await this.vendorModel
//       .findById(id)
//       .populate('stateId', 'name code')
//       .populate('areaId', 'name localGovernment')
//       .populate('marketId', 'name type address entrancePhoto layoutMap')
//       .populate('userId', 'firstName lastName email phone');

//     if (!vendor) {
//       throw new NotFoundException('Vendor not found');
//     }

//     await this.vendorModel.findByIdAndUpdate(id, { $inc: { totalViews: 1 } });

//     return vendor;
//   }

//   async findByUser(userId: string): Promise<Vendor> {
//     const vendor = await this.vendorModel
//       .findOne({ userId })
//       .populate('stateId', 'name code')
//       .populate('areaId', 'name')
//       .populate('marketId', 'name type');

//     if (!vendor) {
//       throw new NotFoundException('Vendor profile not found');
//     }
//     return vendor;
//   }

//   async findByMarket(marketId: string): Promise<Vendor[]> {
//     return this.vendorModel
//       .find({ marketId: new Types.ObjectId(marketId), isActive: true })
//       .populate('userId', 'firstName lastName')
//       .sort({ shopNumber: 1 });
//   }

//   async findNearby(
//     longitude: number,
//     latitude: number,
//     maxDistanceKm: number = 5,
//   ): Promise<Vendor[]> {
//     return this.vendorModel.find({
//       location: {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [longitude, latitude],
//           },
//           $maxDistance: maxDistanceKm * 1000,
//         },
//       },
//       isActive: true,
//     })
//     .populate('stateId', 'name code')
//     .populate('areaId', 'name')
//     .populate('marketId', 'name type');
//   }

//   async update(id: string, dto: UpdateVendorDto, userId: string): Promise<Vendor> {
//     const vendor = await this.vendorModel.findById(id);
//     if (!vendor) {
//       throw new NotFoundException('Vendor not found');
//     }

//     if (vendor.userId.toString() !== userId) {
//       throw new ForbiddenException('You can only update your own vendor profile');
//     }

//     const updateData: any = { ...dto };

//     // ✅ Only set location if valid coordinates provided
//     if (
//       dto.coordinates &&
//       Array.isArray(dto.coordinates) &&
//       dto.coordinates.length === 2 &&
//       typeof dto.coordinates[0] === 'number' &&
//       typeof dto.coordinates[1] === 'number'
//     ) {
//       updateData.location = {
//         type: 'Point',
//         coordinates: dto.coordinates,
//       };
//     }
//     delete updateData.coordinates;

//     // ✅ Ensure no partial location object
//     if (
//       updateData.location &&
//       (!updateData.location.coordinates ||
//         !Array.isArray(updateData.location.coordinates) ||
//         updateData.location.coordinates.length !== 2)
//     ) {
//       delete updateData.location;
//     }

//     const updatedVendor = await this.vendorModel
//       .findByIdAndUpdate(id, updateData, { new: true })
//       .populate('stateId', 'name code')
//       .populate('areaId', 'name')
//       .populate('marketId', 'name type');

//     if (!updatedVendor) {
//       throw new NotFoundException('Vendor not found after update');
//     }

//     return updatedVendor;
//   }

//   async adminUpdate(id: string, dto: UpdateVendorDto): Promise<Vendor> {
//     const updateData: any = { ...dto };

//     // ✅ Only set location if valid coordinates provided
//     if (
//       dto.coordinates &&
//       Array.isArray(dto.coordinates) &&
//       dto.coordinates.length === 2 &&
//       typeof dto.coordinates[0] === 'number' &&
//       typeof dto.coordinates[1] === 'number'
//     ) {
//       updateData.location = {
//         type: 'Point',
//         coordinates: dto.coordinates,
//       };
//     }
//     delete updateData.coordinates;

//     // ✅ Ensure no partial location object
//     if (
//       updateData.location &&
//       (!updateData.location.coordinates ||
//         !Array.isArray(updateData.location.coordinates) ||
//         updateData.location.coordinates.length !== 2)
//     ) {
//       delete updateData.location;
//     }

//     const vendor = await this.vendorModel
//       .findByIdAndUpdate(id, updateData, { new: true })
//       .populate('stateId', 'name code')
//       .populate('areaId', 'name')
//       .populate('marketId', 'name type');

//     if (!vendor) {
//       throw new NotFoundException('Vendor not found');
//     }
//     return vendor;
//   }

//   async incrementProductCount(id: string): Promise<void> {
//     await this.vendorModel.findByIdAndUpdate(id, { $inc: { totalProducts: 1 } });
//   }

//   async decrementProductCount(id: string): Promise<void> {
//     await this.vendorModel.findByIdAndUpdate(id, { $inc: { totalProducts: -1 } });
//   }

//   async delete(id: string, userId: string): Promise<void> {
//     const vendor = await this.vendorModel.findById(id);
//     if (!vendor) {
//       throw new NotFoundException('Vendor not found');
//     }

//     if (vendor.userId.toString() !== userId) {
//       throw new ForbiddenException('You can only delete your own vendor profile');
//     }

//     if (vendor.marketId) {
//       await this.marketsService.decrementShopCount(vendor.marketId.toString());
//     }

//     await this.vendorModel.deleteOne({ _id: id });
//   }

//   async updatePriceRange(vendorId: string, minPrice: number, maxPrice: number): Promise<void> {
//     await this.vendorModel.findByIdAndUpdate(vendorId, {
//       minProductPrice: minPrice || 0,
//       maxProductPrice: maxPrice || 0,
//     });
//   }
// }

// src/vendors/vendors.service.ts — FULL REPLACEMENT
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor } from './schemas/vendor.schema';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { FilterVendorDto } from './dto/filter-vendor.dto';
import { MarketsService } from '../markets/markets.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

// ✅ Helper: normalize any ID to a plain string for comparison
function normalizeId(id: any): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.toString) return id.toString();
  return String(id);
}

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    private marketsService: MarketsService,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateVendorDto, userId: string): Promise<Vendor> {
    const vendorData: any = { ...dto, userId };

    if (
      dto.coordinates &&
      Array.isArray(dto.coordinates) &&
      dto.coordinates.length === 2 &&
      typeof dto.coordinates[0] === 'number' &&
      typeof dto.coordinates[1] === 'number'
    ) {
      vendorData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete vendorData.coordinates;

    if (
      vendorData.location &&
      (!vendorData.location.coordinates ||
        !Array.isArray(vendorData.location.coordinates) ||
        vendorData.location.coordinates.length !== 2)
    ) {
      delete vendorData.location;
    }

    const vendor = await this.vendorModel.create(vendorData);

    await this.usersService.update(userId, { role: Role.VENDOR });
    await this.usersService.updateVendorProfile(userId, vendor._id.toString());

    if (dto.marketId) {
      await this.marketsService.incrementShopCount(dto.marketId);
    }

    return vendor;
  }

  async findAll(filterDto: FilterVendorDto): Promise<{
    vendors: Vendor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      stateId,
      areaId,
      marketId,
      vendorType,
      category,
      search,
      longitude,
      latitude,
      maxDistance,
      isVerified,
      isFeatured,
    } = filterDto;

    const query: Record<string, any> = { isActive: true };

    if (stateId) query.stateId = new Types.ObjectId(stateId);
    if (areaId) query.areaId = new Types.ObjectId(areaId);
    if (marketId) query.marketId = new Types.ObjectId(marketId);
    if (vendorType) query.vendorType = vendorType;
    if (category) query.categories = { $in: [category] };
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

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
    const [vendors, total] = await Promise.all([
      this.vendorModel
        .find(query)
        .populate('stateId', 'name code')
        .populate('areaId', 'name')
        .populate('marketId', 'name type')
        .populate('userId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ isFeatured: -1, rating: -1, createdAt: -1 }),
      this.vendorModel.countDocuments(query),
    ]);

    return {
      vendors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Vendor> {
    const vendor = await this.vendorModel
      .findById(id)
      .populate('stateId', 'name code')
      .populate('areaId', 'name localGovernment')
      .populate('marketId', 'name type address entrancePhoto layoutMap')
      .populate('userId', 'firstName lastName email phone');

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.vendorModel.findByIdAndUpdate(id, { $inc: { totalViews: 1 } });

    return vendor;
  }

  async findByUser(userId: string): Promise<Vendor> {
    // ✅ FIX: Try both string and ObjectId match
    const vendor = await this.vendorModel
      .findOne({
        $or: [
          { userId: userId },
          { userId: new Types.ObjectId(userId) },
        ],
      })
      .populate('stateId', 'name code')
      .populate('areaId', 'name')
      .populate('marketId', 'name type');

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }
    return vendor;
  }

  async findByMarket(marketId: string): Promise<Vendor[]> {
    return this.vendorModel
      .find({ marketId: new Types.ObjectId(marketId), isActive: true })
      .populate('userId', 'firstName lastName')
      .sort({ shopNumber: 1 });
  }

  async findNearby(
    longitude: number,
    latitude: number,
    maxDistanceKm: number = 5,
  ): Promise<Vendor[]> {
    return this.vendorModel.find({
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
    .populate('areaId', 'name')
    .populate('marketId', 'name type');
  }

  // ✅ FIX: Robust ownership check using normalizeId helper
  async update(id: string, dto: UpdateVendorDto, userId: string): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // ✅ FIX: Normalize both IDs to plain strings before comparing
    const vendorUserId = normalizeId(vendor.userId);
    const requestUserId = normalizeId(userId);

    if (vendorUserId !== requestUserId) {
      throw new ForbiddenException(
        `You can only update your own vendor profile. ` +
        `Vendor owner: ${vendorUserId}, Request user: ${requestUserId}`
      );
    }

    const updateData: any = { ...dto };

    if (
      dto.coordinates &&
      Array.isArray(dto.coordinates) &&
      dto.coordinates.length === 2 &&
      typeof dto.coordinates[0] === 'number' &&
      typeof dto.coordinates[1] === 'number'
    ) {
      updateData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete updateData.coordinates;

    if (
      updateData.location &&
      (!updateData.location.coordinates ||
        !Array.isArray(updateData.location.coordinates) ||
        updateData.location.coordinates.length !== 2)
    ) {
      delete updateData.location;
    }

    const updatedVendor = await this.vendorModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('stateId', 'name code')
      .populate('areaId', 'name')
      .populate('marketId', 'name type');

    if (!updatedVendor) {
      throw new NotFoundException('Vendor not found after update');
    }

    return updatedVendor;
  }

  async adminUpdate(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const updateData: any = { ...dto };

    if (
      dto.coordinates &&
      Array.isArray(dto.coordinates) &&
      dto.coordinates.length === 2 &&
      typeof dto.coordinates[0] === 'number' &&
      typeof dto.coordinates[1] === 'number'
    ) {
      updateData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete updateData.coordinates;

    if (
      updateData.location &&
      (!updateData.location.coordinates ||
        !Array.isArray(updateData.location.coordinates) ||
        updateData.location.coordinates.length !== 2)
    ) {
      delete updateData.location;
    }

    const vendor = await this.vendorModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('stateId', 'name code')
      .populate('areaId', 'name')
      .populate('marketId', 'name type');

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async incrementProductCount(id: string): Promise<void> {
    await this.vendorModel.findByIdAndUpdate(id, { $inc: { totalProducts: 1 } });
  }

  async decrementProductCount(id: string): Promise<void> {
    await this.vendorModel.findByIdAndUpdate(id, { $inc: { totalProducts: -1 } });
  }

  async delete(id: string, userId: string): Promise<void> {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // ✅ FIX: Same normalizeId pattern
    const vendorUserId = normalizeId(vendor.userId);
    const requestUserId = normalizeId(userId);

    if (vendorUserId !== requestUserId) {
      throw new ForbiddenException('You can only delete your own vendor profile');
    }

    if (vendor.marketId) {
      await this.marketsService.decrementShopCount(vendor.marketId.toString());
    }

    await this.vendorModel.deleteOne({ _id: id });
  }

  async updatePriceRange(vendorId: string, minPrice: number, maxPrice: number): Promise<void> {
    await this.vendorModel.findByIdAndUpdate(vendorId, {
      minProductPrice: minPrice || 0,
      maxProductPrice: maxPrice || 0,
    });
  }
}