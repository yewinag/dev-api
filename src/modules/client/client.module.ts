import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ClientRespository } from 'src/repositories/client.respository';
import { Client, ClientSchema } from 'src/entities/client.model';
import { Region, RegionSchema } from 'src/entities/region.model';
import { State, StateSchema } from 'src/entities/state.model';
import { Coupon, CouponSchema } from 'src/entities/coupon.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    MongooseModule.forFeature([{ name: Region.name, schema: RegionSchema }]),
    MongooseModule.forFeature([{ name: State.name, schema: StateSchema }]),
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
  ],
  controllers: [ClientController],
  providers: [ClientService, ClientRespository],
  exports: [ClientService, ClientRespository],
})
export class ClientModule {}
