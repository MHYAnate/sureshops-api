import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ReviewType {
  PRODUCT = 'product',
  VENDOR = 'vendor',
}

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ReviewType, required: true })
  type: ReviewType;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  title?: string;

  @Prop()
  comment?: string;

  @Prop([String])
  images?: string[];

  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ default: true })
  isVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ vendorId: 1, userId: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ type: 1, productId: 1 });
ReviewSchema.index({ type: 1, vendorId: 1 });