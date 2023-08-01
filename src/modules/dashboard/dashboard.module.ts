import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRespository } from 'src/repositories/dashboard.respository';
import { Client, ClientSchema } from 'src/entities/client.model';
import { Coupon, CouponSchema } from 'src/entities/coupon.model';
import { Clinic, ClinicSchema } from 'src/entities/clinic.model';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
    MongooseModule.forFeature([{ name: Clinic.name, schema: ClinicSchema }]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRespository],
  exports: [DashboardService, DashboardRespository],
})
export class DashboardModule {}
