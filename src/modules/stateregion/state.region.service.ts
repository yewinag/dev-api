import { Injectable } from '@nestjs/common';
import { GetQueryDto } from '../../dto/getQueryDto';
import { StateRegionRespository } from '../../repositories/stateregion.respository';
@Injectable()
export class StateRegionService {
  constructor(
    private readonly stateRegionRespository: StateRegionRespository,
  ) {}

  async getRegions(getQueryDto: GetQueryDto) {
    return await this.stateRegionRespository.getRegions(getQueryDto);
  }

  async getStates(getQueryDto: GetQueryDto, id: string) {
    return await this.stateRegionRespository.getStates(getQueryDto, id);
  }
}
