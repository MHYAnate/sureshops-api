import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CatalogItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ unique: true, sparse: true })
  sku?: string;

  @Prop({ unique: true, sparse: true })
  barcode?: string;

  @Prop()
  brand?: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  subcategory?: string;

  @Prop([String])
  tags?: string[];

  @Prop([String])
  images?: string[];

  @Prop({ type: Object })
  specifications?: Record<string, any>;

  @Prop([String])
  alternateNames?: string[];

  @Prop({ default: 0 })
  totalListings: number;

  @Prop({ default: 0 })
  lowestPrice: number;

  @Prop({ default: 0 })
  highestPrice: number;

  @Prop({ default: 0 })
  averagePrice: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);

CatalogItemSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
CatalogItemSchema.index({ category: 1, subcategory: 1 });
CatalogItemSchema.index({ sku: 1 });
CatalogItemSchema.index({ barcode: 1 });