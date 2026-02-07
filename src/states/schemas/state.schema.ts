import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class State extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  capital?: string;

  @Prop({ default: 'Nigeria' })
  country: string;

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const StateSchema = SchemaFactory.createForClass(State);

StateSchema.index({ location: '2dsphere' });
StateSchema.index({ name: 1 });
StateSchema.index({ code: 1 });