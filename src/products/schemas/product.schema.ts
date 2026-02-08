import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductStatus, ProductType } from '../../common/enums/product-status.enum';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  // Link to master catalog (optional - for price comparison)
  @Prop({ type: Types.ObjectId, ref: 'CatalogItem' })
  catalogItemId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  sku?: string;

  @Prop()
  barcode?: string;

  @Prop()
  brand?: string;

  @Prop({ type: String, enum: ProductType, default: ProductType.SALE })
  type: ProductType;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice?: number;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop([String])
  images?: string[];

  @Prop({ required: true })
  category: string;

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

  @Prop({ default: 0 })
  searchAppearances: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  inStock: boolean;

  @Prop()
  lastRestocked?: Date;

  // Denormalized location data for faster searches
  @Prop({ type: Types.ObjectId, ref: 'State' })
  stateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area' })
  areaId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Market' })
  marketId?: Types.ObjectId;

  // Geolocation from vendor
  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ location: '2dsphere' });
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ catalogItemId: 1 });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ status: 1, isActive: 1 });
ProductSchema.index({ stateId: 1, areaId: 1, marketId: 1 });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ barcode: 1 });