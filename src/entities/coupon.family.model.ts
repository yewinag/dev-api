import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Program } from './program.model';
import { Service } from './service.model';

@Schema()
export class CouponFamily extends Document {
  @Prop({ required: true })
  familyName: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Program' })
  programId: Program;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Service' })
  serviceId: Service;

  @Prop({ required: true })
  noOfCoupons: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CouponFamilySchema = SchemaFactory.createForClass(CouponFamily);
