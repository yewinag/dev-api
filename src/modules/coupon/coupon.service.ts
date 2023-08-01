import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CouponRespository } from 'src/repositories/coupon.respository';
import { GeneateCouponDto } from './dto/generateCoupon.dto';

@Injectable()
export class CouponService {
  constructor(private readonly clientRespository: CouponRespository) {}

  async createCoupon(createCouponDto: CreateCouponDto, session: ClientSession) {
    return await this.clientRespository.createCoupon(createCouponDto, session);
  }

  async getCouponFamilys(getQueryDto: GetQueryDto) {
    return await this.clientRespository.getCouponFamilys(getQueryDto);
  }

  async getCouponFamilyById(id: string, getQueryDto: GetQueryDto) {
    return await this.clientRespository.getCouponFamilyById(id, getQueryDto);
  }
  async updateCoupon(updtaeCouponDto: UpdateCouponDto, couponId: string) {
    return await this.clientRespository.updateCoupon(updtaeCouponDto, couponId);
  }
  async generateCoupon(
    geneateCouponDto: GeneateCouponDto,
    session: ClientSession,
  ) {
    return await this.clientRespository.generateCoupon(
      geneateCouponDto,
      session,
    );
  }
  async getServiceNameSearch(serviceName: string) {
    return await this.clientRespository.getServiceNameSearch(serviceName);
  }
  async updateCouponStatus(status: boolean, couponId: string) {
    return await this.clientRespository.updateCouponStatus(status, couponId);
  }
  async getAutoCompleteProgram(programName: string) {
    return await this.clientRespository.getAutoCompleteProgram(programName);
  }
  async getAutoCompleteService(serviceName: string) {
    return await this.clientRespository.getAutoCompleteService(serviceName);
  }
  async getRedemeedCouponInformation(getQueryDto: GetQueryDto) {
    return await this.clientRespository.getRedemeedCouponInformation(
      getQueryDto,
    );
  }
  async exportRedemeedCouponInformation(getQueryDto: GetQueryDto) {
    return await this.clientRespository.exportRedemeedCouponInformation(
      getQueryDto,
    );
  }
}
