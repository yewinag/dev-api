import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Response } from 'express';
import { Connection } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private dashboardService: DashboardService,
  ) {}

  @Get('/patient-coupon-count-info')
  async getPatientCouponCountInfo(
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    try {
      const users: any = await this.dashboardService.getPatientCouponCountInfo(
        getQueryDto,
      );
      return res.status(HttpStatus.OK).send(users);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Get('/coupon-info-graph')
  async getCouponInfoGraph(
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    const users: any = await this.dashboardService.getCouponInfoGraph(
      getQueryDto,
    );
    return res.status(HttpStatus.OK).send(users);
  }

  @Get('/client-info-age-group')
  async getClientInfoByAgeGroup(@Res() res: Response) {
    const adminUser: any =
      await this.dashboardService.getClientInfoByAgeGroup();
    return res.status(HttpStatus.OK).send(adminUser);
  }

  @Get('/clinic-count-graph')
  async getClinicCountGraph(
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    const adminUser: any = await this.dashboardService.getClinicCountGraph(
      getQueryDto,
    );
    return res.status(HttpStatus.OK).send(adminUser);
  }
}
