import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

enum Role {
  'NORMAL',
  'SUPER',
  'ADMIN',
}

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, type: String, enum: Role })
  userRole: number;

  @Prop({ default: '' })
  image: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true })
  password: string;

  refreshToken: string;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', function (next: any) {
  console.log('arrived' + !this.isModified('password'));
  if (this.password) {
    bcrypt.hash(this.password, 10, (err, hash) => {
      console.log('hashing..... ' + hash);
      if (err) return next(err);

      this.password = hash;
      console.log(this.password);
      next();
    });
  } else {
    next();
  }
});
