import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Region } from './region.model';

enum Status {
  ACTIVE,
  INACTIVE,
}

@Schema()
export class State extends Document {
  @Prop({ required: true, unique: true })
  stateName: string;

  @Prop({ required: true, enum: Status, default: 'ACTIVE' })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Region' })
  region: Region;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const StateSchema = SchemaFactory.createForClass(State);
