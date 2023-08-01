import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Clinic } from 'src/entities/clinic.model';
import { Doctor } from './doctor.model';

@Schema()
export class RedeemedCoupon extends Document {
  @Prop({ required: true })
  couponCode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  doctorId: Doctor;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Clinic' })
  clinicId: Clinic;

  @Prop({ type: String })
  doctorComment: string;

  @Prop({ required: true })
  status: string;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RedeemedCouponSchema =
  SchemaFactory.createForClass(RedeemedCoupon);
