import { Controller, Get, Req, Request } from '@nestjs/common';
import { AppService } from './app.service';

import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
const publicKey = fs.readFileSync('./src/config/jwtRS256.key.pub', 'utf8');

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/profile')
  getProfileInfo(@Req() request: Request) {
    const token = request.headers['authorization'].split(' ')[1];
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    });
    const { userId, userRole } = decoded;
    console.log(userId, userRole);

    return this.appService.getProfileInfo(userId, userRole);
  }
  @Get('/refresh-token')
  refreshToken(@Req() request: Request) {
    const token = request.headers['authorization'].split(' ')[1];

    return this.appService.refreshToken(token);
  }
}
