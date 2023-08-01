import { Injectable } from '@nestjs/common';
import { ClientSession, Schema as MongooseSchema } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { ClinicRespository } from '../../repositories/clinic.respository';
import { CreateClinicDto } from './dto/createClinic.dto';
import { UpdateClinicDto } from './dto/updateClinic.dto';
import { LoginClinicDto } from './dto/loginClinic.dto';
import { RedeemedCouponDto } from './dto/redeemedCoupon.dto';
import { ChangePassword } from './dto/changePassword.dto';

@Injectable()
export class ClinicService {
  constructor(private readonly clinicRespository: ClinicRespository) {}

  async createClinic(createClinicDto: CreateClinicDto, session: ClientSession) {
    return await this.clinicRespository.createClinic(createClinicDto, session);
  }

  async getClinics(getQueryDto: GetQueryDto) {
    return await this.clinicRespository.getClinics(getQueryDto);
  }

  async getClinicById(id: string) {
    return await this.clinicRespository.getClinicById(id);
  }
  async updateClinic(
    id: MongooseSchema.Types.ObjectId,
    updtaeClinicDto: UpdateClinicDto,
    session: ClientSession,
  ) {
    return await this.clinicRespository.updateClinic(
      id,
      updtaeClinicDto,
      session,
    );
  }
  async clinicLogin(loginClinicDto: LoginClinicDto) {
    return await this.clinicRespository.clinicLogin(loginClinicDto);
  }
  async scanCouponInfo(couponCode: string) {
    return await this.clinicRespository.scanCouponInfo(couponCode);
  }
  async redeemedCoupon(token: string, redeemedCouponDto: RedeemedCouponDto) {
    return await this.clinicRespository.redeemedCoupon(
      token,
      redeemedCouponDto,
    );
  }
  async updateCouponCategory(category: string, couponCode: string) {
    return await this.clinicRespository.updateCouponCategory(
      category,
      couponCode,
    );
  }
  async changePassword(token: string, changePassword: ChangePassword) {
    return await this.clinicRespository.changePassword(token, changePassword);
  }
}
