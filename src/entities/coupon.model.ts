import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CouponFamily } from './coupon.family.model';
import { Clinic } from './clinic.model';
import { Client } from 'src/entities/client.model';
import { Doctor } from './doctor.model';
enum Status {
  'ACTIVE',
  'INACTIVE',
  'REDEEMED',
  'CANCEL',
  'EXPIRED',
  'REJECT',
}
@Schema()
export class Coupon extends Document {
  @Prop({ required: true })
  couponCode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CouponFamily' })
  couponFamilyId: CouponFamily;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Clinic' })
  clinicId: Clinic;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client' })
  userId: Client;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  doctorId: Doctor;

  @Prop({ default: Date.now })
  validFrom: Date;

  @Prop({ default: Date.now })
  validTo: Date;

  @Prop({ type: String })
  doctorComment: string;

  @Prop({ type: String })
  category: string;

  @Prop({ default: 'ACTIVE', enum: Status })
  status: string;

  @Prop({ type: Date })
  redemeedDate: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
