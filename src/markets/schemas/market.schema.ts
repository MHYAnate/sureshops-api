import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MarketType } from '../../common/enums/market-type.enum';

@Schema({ timestamps: true })
export class Market extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: MarketType, required: true })
  type: MarketType;

  @Prop({ type: Types.ObjectId, ref: 'State', required: true })
  stateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  areaId: Types.ObjectId;

  @Prop()
  address?: string;

  @Prop()
  landmark?: string;

  // ✅ FIX: Remove default: 'Point', use raw schema definition,
  //         and set the entire field's default to undefined
  @Prop({
    type: {
      type: { type: String, enum: ['Point'] },   // ← NO default
      coordinates: { type: [Number] },
    },
    required: false,
    default: undefined,                            // ← entire field stays absent
    _id: false,                                    // ← no sub-document _id
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop()
  entrancePhoto?: string;

  @Prop()
  layoutMap?: string;

  @Prop({ type: [String], default: [] })
  additionalPhotos?: string[];

  @Prop()
  openingTime?: string;

  @Prop()
  closingTime?: string;

  @Prop({ type: [String] })
  operatingDays?: string[];

  @Prop()
  contactPhone?: string;

  @Prop()
  contactEmail?: string;

  @Prop({ default: 0 })
  totalShops: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;
}

export const MarketSchema = SchemaFactory.createForClass(Market);

// ✅ FIX: sparse index — skips documents where location is absent
MarketSchema.index({ location: '2dsphere' }, { sparse: true });
MarketSchema.index({ stateId: 1, areaId: 1 });
MarketSchema.index({ type: 1 });
MarketSchema.index({ name: 'text', address: 'text' });