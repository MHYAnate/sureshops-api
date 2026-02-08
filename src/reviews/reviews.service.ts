import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewType } from './schemas/review.schema';
import { Vendor } from '../vendors/schemas/vendor.schema';
import { Product } from '../products/schemas/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Check for existing review
    const existingQuery: any = { userId, type: dto.type };
    if (dto.type === ReviewType.PRODUCT) {
      existingQuery.productId = dto.productId;
    } else {
      existingQuery.vendorId = dto.vendorId;
    }

    const existing = await this.reviewModel.findOne(existingQuery);
    if (existing) {
      throw new ConflictException('You have already reviewed this item');
    }

    const review = await this.reviewModel.create({
      userId,
      ...dto,
    });

    // ✅ FIX 1: Extract itemId with a fallback, assert it's defined
    const itemId = dto.productId ?? dto.vendorId;
    if (!itemId) {
      throw new NotFoundException('Product or Vendor ID is required');
    }
    await this.updateItemRating(dto.type, itemId);

    return review;
  }

  async findByProduct(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reviews: Review[];
    total: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const skip = (page - 1) * limit;

    const [reviews, total, ratingAgg] = await Promise.all([
      this.reviewModel
        .find({ productId, isActive: true })
        .populate('userId', 'firstName lastName avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.reviewModel.countDocuments({ productId, isActive: true }),
      this.reviewModel.aggregate([
        { $match: { productId, isActive: true } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            ratings: { $push: '$rating' },
          },
        },
      ]),
    ]);

    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingAgg.length > 0 && ratingAgg[0].ratings) {
      ratingAgg[0].ratings.forEach((r: number) => {
        ratingDistribution[r]++;
      });
    }

    return {
      reviews,
      total,
      averageRating: ratingAgg[0]?.averageRating || 0,
      ratingDistribution,
    };
  }

  async findByVendor(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reviews: Review[];
    total: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const skip = (page - 1) * limit;

    const [reviews, total, ratingAgg] = await Promise.all([
      this.reviewModel
        .find({ vendorId, isActive: true })
        .populate('userId', 'firstName lastName avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.reviewModel.countDocuments({ vendorId, isActive: true }),
      this.reviewModel.aggregate([
        { $match: { vendorId, isActive: true } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            ratings: { $push: '$rating' },
          },
        },
      ]),
    ]);

    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingAgg.length > 0 && ratingAgg[0].ratings) {
      ratingAgg[0].ratings.forEach((r: number) => {
        ratingDistribution[r]++;
      });
    }

    return {
      reviews,
      total,
      averageRating: ratingAgg[0]?.averageRating || 0,
      ratingDistribution,
    };
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewModel
      .find({ userId })
      .populate('productId', 'name images')
      .populate('vendorId', 'businessName shopImages')
      .sort({ createdAt: -1 });
  }

  async update(id: string, userId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // ✅ FIX 2: Handle null return from findByIdAndUpdate
    const updated = await this.reviewModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) {
      throw new NotFoundException('Review not found after update');
    }

    // Update rating if rating changed
    if (dto.rating !== undefined) {
      // ✅ FIX 3: Guard against undefined itemId
      const itemId = review.productId?.toString() ?? review.vendorId?.toString();
      if (itemId) {
        await this.updateItemRating(review.type, itemId);
      }
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewModel.deleteOne({ _id: id });

    // ✅ FIX 4: Guard against undefined itemId
    const itemId = review.productId?.toString() ?? review.vendorId?.toString();
    if (itemId) {
      await this.updateItemRating(review.type, itemId);
    }
  }

  async markHelpful(id: string): Promise<Review> {
    // ✅ FIX 5: Handle null return from findByIdAndUpdate
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { $inc: { helpfulCount: 1 } },
      { new: true },
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  private async updateItemRating(type: ReviewType, itemId: string): Promise<void> {
    const query =
      type === ReviewType.PRODUCT
        ? { productId: itemId, isActive: true }
        : { vendorId: itemId, isActive: true };

    const result = await this.reviewModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const rating = result[0]?.averageRating || 0;
    const count = result[0]?.count || 0;

    if (type === ReviewType.VENDOR) {
      await this.vendorModel.findByIdAndUpdate(itemId, {
        rating: Math.round(rating * 10) / 10,
        reviewCount: count,
      });
    }
  }
}