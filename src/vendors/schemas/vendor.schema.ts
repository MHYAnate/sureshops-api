import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VendorType } from '../../common/enums/vendor-type.enum';

@Schema({ _id: false })
class BankDetails {
  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop()
  bankCode?: string;
}

@Schema({ _id: false })
class ContactDetails {
  @Prop({ required: true })
  phone: string;

  @Prop()
  alternatePhone?: string;

  @Prop()
  email?: string;

  @Prop()
  whatsapp?: string;

  @Prop()
  instagram?: string;

  @Prop()
  facebook?: string;

  @Prop()
  twitter?: string;

  @Prop()
  website?: string;
}

@Schema({ _id: false })
class ShopImages {
  @Prop()
  entrancePhoto?: string;

  @Prop()
  logo?: string;

  @Prop()
  layoutMap?: string;

  @Prop([String])
  additionalImages?: string[];
}

@Schema({ _id: false })
class OperatingHours {
  @Prop()
  openingTime?: string;

  @Prop()
  closingTime?: string;

  @Prop([String])
  operatingDays?: string[];

  @Prop({ default: false })
  is24Hours?: boolean;
}

@Schema({ timestamps: true })
export class Vendor extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  businessName: string;

  @Prop()
  businessDescription?: string;

  @Prop({ type: String, enum: VendorType, required: true })
  vendorType: VendorType;

  // Location Hierarchy
  @Prop({ type: Types.ObjectId, ref: 'State', required: true })
  stateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  areaId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Market' })
  marketId?: Types.ObjectId;

  // Shop Details
  @Prop()
  shopNumber?: string;

  @Prop()
  shopFloor?: string;

  @Prop()
  shopBlock?: string;

  @Prop()
  shopAddress?: string;

  @Prop()
  landmark?: string;

  // Geolocation
  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  // Images
  @Prop({ type: ShopImages })
  shopImages?: ShopImages;

  // Contact & Banking
  @Prop({ type: ContactDetails, required: true })
  contactDetails: ContactDetails;

  @Prop({ type: BankDetails })
  bankDetails?: BankDetails;

  // Operating Hours
  @Prop({ type: OperatingHours })
  operatingHours?: OperatingHours;

  // Categories of products sold
  @Prop([String])
  categories?: string[];

  @Prop([String])
  tags?: string[];

  // Statistics
  @Prop({ default: 0 })
  totalProducts: number;

  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  searchAppearances: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  // Price Range (computed from products)
  @Prop({ default: 0 })
  minProductPrice: number;

  @Prop({ default: 0 })
  maxProductPrice: number;

  // Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isOpen: boolean;

  createdAt: Date;
updatedAt: Date;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

VendorSchema.index({ location: '2dsphere' });
VendorSchema.index({ stateId: 1, areaId: 1, marketId: 1 });
VendorSchema.index({ userId: 1 });
VendorSchema.index({ vendorType: 1 });
VendorSchema.index({ categories: 1 });
VendorSchema.index({ isActive: 1, isVerified: 1 });
VendorSchema.index({ businessName: 'text', businessDescription: 'text', tags: 'text' });