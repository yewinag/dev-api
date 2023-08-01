import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Clinic } from 'src/entities/clinic.model';

@Schema()
export class Doctor extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  samaID: string;

  @Prop({ default: '' })
  academicTitle: string;

  @Prop({ default: '' })
  medicalDegree: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Clinic' })
  clinicId: Clinic;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
