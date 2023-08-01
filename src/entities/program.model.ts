import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Program extends Document {
  @Prop({ required: true, unique: true })
  programName: string;

  @Prop({ required: true, default: true })
  status: true;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
