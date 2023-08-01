import { Injectable } from '@nestjs/common';
import { GetQueryDto } from '../../dto/getQueryDto';
import { DashboardRespository } from '../../repositories/dashboard.respository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRespository: DashboardRespository) {}

  async getPatientCouponCountInfo(getQueryDto: GetQueryDto) {
    return await this.dashboardRespository.getPatientCouponCountInfo(
      getQueryDto,
    );
  }

  async getCouponInfoGraph(getQueryDto: GetQueryDto) {
    return await this.dashboardRespository.getCouponInfoGraph(getQueryDto);
  }

  async getClientInfoByAgeGroup() {
    return await this.dashboardRespository.getClientInfoByAgeGroup();
  }
  async getClinicCountGraph(getQueryDto: GetQueryDto) {
    return await this.dashboardRespository.getClinicCountGraph(getQueryDto);
  }
}
