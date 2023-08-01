import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StateRegionController } from './state.region.controller';
import { StateRegionService } from './state.region.service';
import { StateRegionRespository } from 'src/repositories/stateregion.respository';
import { Region, RegionSchema } from 'src/entities/region.model';
import { State, StateSchema } from 'src/entities/state.model';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Region.name, schema: RegionSchema }]),

    MongooseModule.forFeature([{ name: State.name, schema: StateSchema }]),
  ],
  controllers: [StateRegionController],
  providers: [StateRegionService, StateRegionRespository],
  exports: [StateRegionService, StateRegionRespository],
})
export class StateRegionModule {}
