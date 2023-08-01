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
  Req,
  Res,
  Request,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Response } from 'express';
import { Connection, Schema as MongooseSchema } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { CreateClinicDto } from './dto/createClinic.dto';
import { UpdateClinicDto } from './dto/updateClinic.dto';
import { ClinicService } from './clinic.service';
import { LoginClinicDto } from './dto/loginClinic.dto';
import { CouponScanDto } from './dto/couponScan.dto';
import { RedeemedCouponDto } from './dto/redeemedCoupon.dto';
import { ChangePassword } from './dto/changePassword.dto';

@Controller('clinic')
export class ClinicController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private clinicService: ClinicService,
  ) {}

  @Post('/create')
  async createClinic(
    @Body() createClinicDto: CreateClinicDto,
    @Res() res: Response,
  ) {
    let session;
    try {
      session = await this.mongoConnection.startSession();
      session.startTransaction();
      console.log(createClinicDto);

      const newClientUser: any = await this.clinicService.createClinic(
        createClinicDto,
        session,
      );
      await session.commitTransaction();
      newClientUser.userId = newClientUser._id;
      delete newClientUser._id;
      console.log(newClientUser);

      return res.status(HttpStatus.CREATED).send(newClientUser);
    } catch (error) {
      await session.abortTransaction();
      console.log(error.message);

      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Get('/get')
  async getClinics(@Query() getQueryDto: GetQueryDto, @Res() res: Response) {
    const users: any = await this.clinicService.getClinics(getQueryDto);
    return res.status(HttpStatus.OK).send(users);
  }

  @Get('/get/:clinicId')
  async getClinicById(@Param('clinicId') id: string, @Res() res: Response) {
    const adminUser: any = await this.clinicService.getClinicById(id);
    return res.status(HttpStatus.OK).send(adminUser);
  }

  @Put('/update/:clinicId')
  async updateClinic(
    @Param('clinicId') id: MongooseSchema.Types.ObjectId,
    @Body() updtaeClinicDto: UpdateClinicDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const updateClientUser: any = await this.clinicService.updateClinic(
        id,
        updtaeClinicDto,
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

  @Post('/login')
  async clinicLogin(
    @Body() loginClinicDto: LoginClinicDto,
    @Res() res: Response,
  ) {
    try {
      const loginedClinic: any = await this.clinicService.clinicLogin(
        loginClinicDto,
      );
      return res.status(HttpStatus.OK).send(loginedClinic);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post('/scan-code')
  async scanCouponInfo(
    @Body() couponScanDto: CouponScanDto,
    @Res() res: Response,
  ) {
    try {
      const coupon: any = await this.clinicService.scanCouponInfo(
        couponScanDto.couponCode,
      );
      return res.status(HttpStatus.OK).send(coupon);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  @Post('/redeemed-reject')
  async redeemedCoupon(
    @Req() req: Request,
    @Body() redeemedCouponDto: RedeemedCouponDto,
    @Res() res: Response,
  ) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      const redeemedCoupon: any = await this.clinicService.redeemedCoupon(
        token,
        redeemedCouponDto,
      );
      return res.status(HttpStatus.OK).send(redeemedCoupon);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post('/update-coupon-category')
  async updateCouponCategory(
    @Req() req: Request,
    @Body() data: { category: string; couponCode: string },
    @Res() res: Response,
  ) {
    try {
      const redeemedCoupon: any = await this.clinicService.updateCouponCategory(
        data.category,
        data.couponCode,
      );
      return res.status(HttpStatus.OK).send(redeemedCoupon);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post('/change-password')
  async changePassword(
    @Req() req: Request,
    @Body() changePassword: ChangePassword,
    @Res() res: Response,
  ) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      const redeemedCoupon: any = await this.clinicService.changePassword(
        token,
        changePassword,
      );
      return res.status(HttpStatus.OK).send(redeemedCoupon);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
