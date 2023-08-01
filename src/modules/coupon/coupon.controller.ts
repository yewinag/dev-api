import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Response } from 'express';
import { Connection } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CouponService } from './coupon.service';
import { GeneateCouponDto } from './dto/generateCoupon.dto';

@Controller('coupon')
export class CouponController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private couponService: CouponService,
  ) {}

  @Post('/family/create')
  async createClient(
    @Body() createCouponDto: CreateCouponDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const newClientUser: any = await this.couponService.createCoupon(
        createCouponDto,
        session,
      );
      await session.commitTransaction();
      newClientUser.userId = newClientUser._id;
      delete newClientUser._id;
      console.log(newClientUser);

      return res.status(HttpStatus.CREATED).send(newClientUser);
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Get('/family/get')
  async getCouponFamilys(
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    const users: any = await this.couponService.getCouponFamilys(getQueryDto);
    return res.status(HttpStatus.OK).send(users);
  }

  @Get('/family/get/:couponFamilyId')
  async getCouponFamilyById(
    @Query() getQueryDto: GetQueryDto,
    @Param('couponFamilyId') id: string,
    @Res() res: Response,
  ) {
    const adminUser: any = await this.couponService.getCouponFamilyById(
      id,
      getQueryDto,
    );
    return res.status(HttpStatus.OK).send(adminUser);
  }

  @Get('/family/search/:serviceName')
  async getServiceNameSearch(
    @Param('serviceName') serviceName: string,
    @Res() res: Response,
  ) {
    const adminUser: any = await this.couponService.getServiceNameSearch(
      serviceName,
    );
    return res.status(HttpStatus.OK).send(adminUser);
  }

  @Put('/family/update/:couponFamilyId')
  async updateClient(
    @Body() updtaeClientDto: UpdateCouponDto,
    @Param('couponFamilyId') couponId: string,
    @Res() res: Response,
  ) {
    try {
      const updateClientUser: any = await this.couponService.updateCoupon(
        updtaeClientDto,
        couponId,
      );
      return res.status(HttpStatus.OK).send(updateClientUser);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  @Post('/generate')
  async generateCoupon(
    @Body() geneateCouponDto: GeneateCouponDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const updateClientUser: any = await this.couponService.generateCoupon(
        geneateCouponDto,
        session,
      );
      await session.commitTransaction();
      updateClientUser.userId = updateClientUser._id;
      delete updateClientUser._id;
      return res.status(HttpStatus.OK).send(updateClientUser);
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Put('/update/couponStatus/:couponId')
  async updateCouponStatus(
    @Body() updtaeClientDto: UpdateCouponDto,
    @Param('couponId') couponId: string,
    @Res() res: Response,
  ) {
    try {
      const updateClientUser: any = await this.couponService.updateCouponStatus(
        updtaeClientDto.status,
        couponId,
      );
      return res.status(HttpStatus.OK).send(updateClientUser);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Get('/autocomplete/program/:programName')
  async getAutoCompleteProgram(
    @Param('programName') programName: string,
    @Res() res: Response,
  ) {
    const program: any = await this.couponService.getAutoCompleteProgram(
      programName,
    );
    return res.status(HttpStatus.OK).send(program);
  }

  @Get('/autocomplete/service/:serviceName')
  async getAutoCompleteService(
    @Param('serviceName') serviceName: string,
    @Res() res: Response,
  ) {
    const service: any = await this.couponService.getAutoCompleteService(
      serviceName,
    );
    return res.status(HttpStatus.OK).send(service);
  }
  @Get('/redemeed-info')
  async getRedemeedCouponInformation(
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    const service: any = await this.couponService.getRedemeedCouponInformation(
      getQueryDto,
    );
    return res.status(HttpStatus.OK).send(service);
  }

  @Post('/export-redemeed-info')
  async exportRedemeedCouponInformation(
    @Query() getQueryDto: GetQueryDto,
    @Res() res: Response,
  ) {
    const service: any =
      await this.couponService.exportRedemeedCouponInformation(getQueryDto);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=coupon_redemeed.csv',
    );
    return res.status(HttpStatus.OK).end(service);
  }
}
