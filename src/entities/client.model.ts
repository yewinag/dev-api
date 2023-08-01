import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Coupon } from './coupon.model';
import { Region } from 'src/entities/region.model';
import { State } from 'src/entities/state.model';

@Schema()
export class Client extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, type: Number, default: 0 })
  age: number;

  @Prop({ required: true, type: Date })
  dateOfBirth: Date;

  @Prop({ required: true, type: Boolean, default: false })
  pragrancyStatus: boolean;

  @Prop({ required: true, type: Number, default: 0 })
  noOfChildren: number;

  @Prop({ required: true, type: Number, default: 0 })
  geastralMonth: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Coupon' })
  couponId: Coupon;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Region' })
  regionId: Region;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'State' })
  stateId: State;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
