import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/entities/user.model';
import { Clinic } from 'src/entities/clinic.model';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import axios from 'axios';
import { Client } from 'src/entities/client.model';

const publicKey = fs.readFileSync('./src/config/jwtRS256.key.pub', 'utf8');
const privateKey = fs.readFileSync(
  process.cwd() + '/src/config/jwtRS256.key',
  'utf-8',
);

export class CommonRespository {
  constructor(
    @InjectModel(User.name)
    private readonly adminModel: Model<User>,
    @InjectModel(Clinic.name)
    private readonly providerModel: Model<Clinic>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
  ) {}

  async getProfileInfo(userId: string, userRole: string) {
    try {
      let user;
      if (userRole == 'CLINIC') {
        user = await this.providerModel.findById(userId);
      } else {
        user = await this.adminModel.findById(userId);
      }
      const response = {
        ok: true,
        data: user,
      };
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }
  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        ignoreExpiration: true,
      });
      const { userId, userRole } = payload;
      const refreshToken = jwt.sign(
        {
          userId: userId,
          userRole: userRole,
        },
        privateKey,
        {
          algorithm: 'RS256',
          expiresIn: '1d',
        },
      );
      const existingToken =
        userRole == 'CLINIC'
          ? await this.providerModel.findById(userId)
          : await this.adminModel.findById(userId);
      if (
        existingToken.refreshToken == refreshToken ||
        existingToken.refreshToken == null
      ) {
        if (userRole == 'CLINIC') {
          await this.providerModel.findByIdAndUpdate(userId, {
            $set: {
              refreshToken,
            },
          });
        } else {
          await this.adminModel.findByIdAndUpdate(userId, {
            $set: {
              refreshToken,
            },
          });
        }
        return { refreshToken };
      } else {
        throw new BadRequestException(
          'Something went wrong. You need to login again.',
        );
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong');
    }
  }
  async sendSMS(userId: string, message: string) {
    try {
      const client = await this.clientModel.findById(userId);
      const data = {
        to: client ? client.phoneNumber : '',
        message: message,
      };
      const headers = {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer hW1TjU1JQ_31wfhJGbn4QADty8oMmrnjA2qWsw1342iScKt3aNAqOHEa1_c3q8LD',
      };

      await axios.post('https://smspoh.com/api/v1/send ', data, {
        headers: headers,
      });
      return { message: 'Successfully send message' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Sending message api error',
        error,
      );
    }
  }
}
