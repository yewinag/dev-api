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
import { Connection, Schema as MongooseSchema } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { CreateAdminDto } from './dto/createAdmin.dto';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/loginAdmin.dto';
import { UpdateAdminDto } from 'src/modules/admin/dto/updateAdmin.dto';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private adminService: AdminService,
  ) {}

  @Post('/create')
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      createAdminDto.password = 'admin@123'; //default
      const newAdminUser = await this.adminService.createAdmin(
        createAdminDto,
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send(newAdminUser);
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Post('/login')
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto, @Res() res: Response) {
    try {
      const loginedAdmin: any = await this.adminService.loginAdmin(
        loginAdminDto,
      );
      return res.status(HttpStatus.OK).send(loginedAdmin);
    } catch (error) {
      console.log(error.message);

      throw new BadRequestException(error);
    }
  }

  @Get('/get')
  async getAdminUsers(@Query() getQueryDto: GetQueryDto, @Res() res: Response) {
    const users: any = await this.adminService.getAdminUsers(getQueryDto);
    return res.status(HttpStatus.OK).send(users);
  }

  @Get('/get/:userId')
  async getAdminUserById(
    @Param('userId') id: MongooseSchema.Types.ObjectId,
    @Res() res: Response,
  ) {
    const adminUser: any = await this.adminService.getAdminUserById(id);
    return res.status(HttpStatus.OK).send(adminUser);
  }

  @Put('/update/:userId')
  async updateAdminUserById(
    @Param('userId') id: MongooseSchema.Types.ObjectId,
    @Body() updateAdminDto: UpdateAdminDto,
    @Res() res: Response,
  ) {
    try {
      const adminUser: any = await this.adminService.updateAdmin(
        id,
        updateAdminDto,
      );
      const {
        _id: userId,
        name,
        email,
        userRole,
        image,
        status,
        updateAt,
        createdAt,
      } = adminUser;

      return res.status(HttpStatus.OK).send({
        userId,
        name,
        email,
        userRole,
        image,
        status,
        updateAt,
        createdAt,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
