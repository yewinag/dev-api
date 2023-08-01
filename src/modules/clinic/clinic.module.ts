import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';
import { ClinicRespository } from 'src/repositories/clinic.respository';
import { Clinic, ClinicSchema } from 'src/entities/clinic.model';
import { Doctor, DoctorSchema } from 'src/entities/doctor.model';
import { Coupon, CouponSchema } from 'src/entities/coupon.model';
import { Region, RegionSchema } from 'src/entities/region.model';
import { State, StateSchema } from 'src/entities/state.model';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Clinic.name,
        useFactory: () => {
          const schema = ClinicSchema;
          console.log('schs');

          schema.pre('save', function (next: any) {
            console.log('arrived');
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
          return schema;
        },
      },
    ]),
    MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }]),
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
    MongooseModule.forFeature([{ name: Region.name, schema: RegionSchema }]),
    MongooseModule.forFeature([{ name: State.name, schema: StateSchema }]),
  ],
  controllers: [ClinicController],
  providers: [ClinicService, ClinicRespository],
  exports: [ClinicService, ClinicRespository],
})
export class ClinicModule {}
