import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

enum Status {
  ACTIVE,
  INACTIVE,
}

@Schema()
export class Region extends Document {
  @Prop({ required: true, unique: true })
  regionName: string;

  @Prop({ required: true, enum: Status, default: 'ACTIVE' })
  status: string;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RegionSchema = SchemaFactory.createForClass(Region);
