import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CouponFamily,
  CouponFamilySchema,
} from 'src/entities/coupon.family.model';
import { CouponRespository } from 'src/repositories/coupon.respository';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon, CouponSchema } from 'src/entities/coupon.model';
import { Program, ProgramSchema } from 'src/entities/program.model';
import { Service, ServiceSchema } from 'src/entities/service.model';
import { Client, ClientSchema } from 'src/entities/client.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CouponFamily.name, schema: CouponFamilySchema },
    ]),

    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
    MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }]),
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
  ],
  controllers: [CouponController],
  providers: [CouponService, CouponRespository],
  exports: [CouponService, CouponRespository],
})
export class CouponModule {}
