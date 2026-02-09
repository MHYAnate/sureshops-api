import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ProductStatus, ProductType } from '../../common/enums/product-status.enum';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

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

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.APPROVED })
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

  // ✅ Geolocation — use Object type, define properly after schema creation
  @Prop({ type: Object })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// ✅ Define location path AFTER schema creation
// This prevents auto-defaulting { type: "Point" } when no coordinates exist
ProductSchema.path('location', new MongooseSchema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
));

// ✅ Location is NOT required at document level
ProductSchema.path('location').required(false);

// ✅ sparse: true — skips documents where location is absent
ProductSchema.index({ location: '2dsphere' }, { sparse: true });
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ catalogItemId: 1 });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ status: 1, isActive: 1 });
ProductSchema.index({ stateId: 1, areaId: 1, marketId: 1 });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ barcode: 1 });