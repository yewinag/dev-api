import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientSession, Schema as MongooseSchema } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { AdminRespository } from '../../repositories/admin.respository';
import { CreateAdminDto } from './dto/createAdmin.dto';
import { LoginAdminDto } from './dto/loginAdmin.dto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
const privateKey = fs.readFileSync(
  process.cwd() + '/src/config/jwtRS256.key',
  'utf-8',
);
import * as bcrypt from 'bcrypt';
import { UpdateAdminDto } from 'src/modules/admin/dto/updateAdmin.dto';
@Injectable()
export class AdminService {
  constructor(private readonly adminRespository: AdminRespository) {}

  async createAdmin(createAdminDto: CreateAdminDto, session: ClientSession) {
    // const getUser: any = await this.adminRespository.getAdminByEmail(createAdminDto.email);
    console.log(JSON.stringify(createAdminDto));
    return await this.adminRespository.createAdmin(createAdminDto, session);
    // if (createAdminDto.userRole === 'SUPER') {

    // } else {
    //   throw new UnauthorizedException('Incorrect Role');
    // }
  }

  async loginAdmin(loginAdminDto: LoginAdminDto) {
    const getUser: any = await this.adminRespository.getAdminByEmail(
      loginAdminDto.email,
    );

    if (getUser && getUser.status) {
      const token = jwt.sign(
        {
          userId: getUser._id,
          userRole: getUser.userRole,
        },
        privateKey,
        {
          algorithm: 'RS256',
          expiresIn: '1d',
        },
      );
      const result = await bcrypt.compare(
        loginAdminDto.password,
        getUser.password,
      );
      if (!result) throw new UnauthorizedException('password is wrong');
      await this.adminRespository.updateRefreshToken(getUser._id, token);
      return {
        email: getUser.email,
        token,
        userRole: getUser.userRole,
      };
    } else {
      if (getUser) {
        throw new NotFoundException(
          'This user account is disabled, cannot login',
        );
      } else {
        throw new NotFoundException('The Admin with this email does not exist');
      }
    }
  }

  async getAdminUsers(getQueryDto: GetQueryDto) {
    return await this.adminRespository.getAdminUsers(getQueryDto);
  }

  async getAdminUserById(id: MongooseSchema.Types.ObjectId) {
    return await this.adminRespository.getAdminUserById(id);
  }
  async updateAdmin(
    id: MongooseSchema.Types.ObjectId,
    updateAdminDto: UpdateAdminDto,
  ) {
    return await this.adminRespository.updateAdmin(id, updateAdminDto);
  }
}
