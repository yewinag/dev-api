import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Response } from 'express';
import { Connection } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { StateRegionService } from './state.region.service';
@Controller('region')
export class StateRegionController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private stateRegionService: StateRegionService,
  ) {}

  @Get('/get')
  async getRegions(@Query() getQueryDto: GetQueryDto, @Res() res: Response) {
    const users: any = await this.stateRegionService.getRegions(getQueryDto);
    return res.status(HttpStatus.OK).send(users);
  }
  @Get('/state/:regionId')
  async getStates(
    @Param('regionId') id: string,
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    const users: any = await this.stateRegionService.getStates(getQueryDto, id);
    return res.status(HttpStatus.OK).send(users);
  }
}
