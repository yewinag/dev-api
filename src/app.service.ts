import { Injectable } from '@nestjs/common';
import { CommonRespository } from './repositories/common.respository';

@Injectable()
export class AppService {
  constructor(private readonly commonRespository: CommonRespository) {}
  getHello(): string {
    return 'Welcome CUPON ADMIN';
  }
  async getProfileInfo(userId: string, userRole: string) {
    return await this.commonRespository.getProfileInfo(userId, userRole);
  }
  async refreshToken(token: string) {
    return await this.commonRespository.refreshToken(token);
  }
}
