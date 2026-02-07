import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Area extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'State', required: true })
  stateId: Types.ObjectId;

  @Prop()
  localGovernment?: string;

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop()
  postalCode?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const AreaSchema = SchemaFactory.createForClass(Area);

AreaSchema.index({ location: '2dsphere' });
AreaSchema.index({ stateId: 1 });
AreaSchema.index({ name: 1, stateId: 1 });