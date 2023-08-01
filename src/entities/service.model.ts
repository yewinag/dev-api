import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Service extends Document {
  @Prop({ required: true, unique: true })
  serviceName: string;

  @Prop({ required: true, default: true })
  status: true;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
