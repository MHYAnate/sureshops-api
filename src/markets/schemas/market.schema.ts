import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
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

  // ✅ FIX: Simple type declaration — schema defined below
  @Prop({ type: Object })
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

// ✅ FIX: Define the location path AFTER schema creation
//         This gives us full control over the sub-schema
MarketSchema.path('location', new MongooseSchema(
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

// ✅ Make location not required at the document level
MarketSchema.path('location').required(false);

// ✅ sparse: true — skips documents where location is absent
MarketSchema.index({ location: '2dsphere' }, { sparse: true });
MarketSchema.index({ stateId: 1, areaId: 1 });
MarketSchema.index({ type: 1 });
MarketSchema.index({ name: 'text', address: 'text' });