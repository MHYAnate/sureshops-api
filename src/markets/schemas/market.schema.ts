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

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop()
  entrancePhoto?: string;

  @Prop()
  layoutMap?: string;

  @Prop([String])
  additionalPhotos?: string[];

  @Prop()
  openingTime?: string;

  @Prop()
  closingTime?: string;

  @Prop([String])
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

MarketSchema.index({ location: '2dsphere' });
MarketSchema.index({ stateId: 1, areaId: 1 });
MarketSchema.index({ type: 1 });
MarketSchema.index({ name: 'text', address: 'text' });