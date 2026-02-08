import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductStatus, ProductType } from '../../common/enums/product-status.enum';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: ProductType, default: ProductType.SALE })
  type: ProductType;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice?: number;

  @Prop()
  currency: string = 'NGN';

  @Prop([String])
  images?: string[];

  @Prop()
  category?: string;

  @Prop()
  subcategory?: string;

  @Prop([String])
  tags?: string[];

  @Prop({ default: 0 })
  quantity: number;

  @Prop()
  unit?: string;

  @Prop({ type: Object })
  specifications?: Record<string, any>;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.PENDING })
  status: ProductStatus;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ price: 1 });