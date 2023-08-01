import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Schema as MongooseSchema } from 'mongoose';
import { GetQueryDto } from '../dto/getQueryDto';
import { ResponseDto } from '../dto/response.dto';
import { User } from '../entities/user.model';
import { CreateAdminDto } from 'src/modules/admin/dto/createAdmin.dto';
import { UpdateAdminDto } from 'src/modules/admin/dto/updateAdmin.dto';

export class AdminRespository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto, session: ClientSession) {
    // let user = await this.getAdminByEmail(createAdminDto.email);

    // if (user) {
    //     throw new ConflictException('Admin Already Exists!');
    // }
    let user = new this.userModel({
      name: createAdminDto.name,
      email: createAdminDto.email,
      userRole: createAdminDto.userRole,
      password: createAdminDto.password,
      status: createAdminDto.status || true,
    });

    try {
      user = await user.save({ session });
    } catch (error) {
      console.log(error.message);
      throw new InternalServerErrorException('Error in saving DB', error);
    }

    return user;
  }

  async getAdminUsers(query: GetQueryDto) {
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let users: User[];

    try {
      let searchQuery = {
        $match: {},
      };
      let dateRangeQuery = {
        $match: {},
      };
      if (query.startDate && query.endDate) {
        dateRangeQuery = {
          $match: {
            createdAt: {
              $gte: new Date(query.startDate),
              $lt: new Date(query.endDate),
            },
          },
        };
      }
      if (query.search) {
        searchQuery = query.searchColumn
          ? query.searchColumn == 'name'
            ? {
                $match: {
                  $or: [
                    {
                      name: {
                        $regex: query.search,
                        $options: 'i',
                      },
                    },
                  ],
                },
              }
            : {
                $match: {
                  $or: [
                    {
                      email: {
                        $regex: query.search,
                        $options: 'i',
                      },
                    },
                  ],
                },
              }
          : {
              $match: {
                $or: [
                  {
                    name: {
                      $regex: query.search,
                      $options: 'i',
                    },
                  },
                  {
                    email: {
                      $regex: query.search,
                      $options: 'i',
                    },
                  },
                ],
              },
            };
      }
      const result = await this.userModel.aggregate([
        searchQuery,
        dateRangeQuery,
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: 1,
            email: 1,
            userRole: 1,
            image: 1,
            status: {
              $cond: ['$status', '$status', false],
            },
          },
        },
        {
          $facet: {
            usreList: [{ $skip: skip }, { $limit: limit }],
            nTotal: [
              {
                $count: 'count',
              },
            ],
          },
        },
      ]);
      let response: ResponseDto;
      const { usreList, nTotal } = result[0];
      users = usreList;

      if (users.length > 0) {
        response = {
          ok: true,
          data: users,
          message: 'Get Admin Data Success!',
          page,
          limit,
          nTotal: nTotal[0] ? nTotal[0].count : 0,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No Admin User Exist',
          page,
          limit,
          nTotal: 0,
        };
      }
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }

  async getAdminUserById(id: MongooseSchema.Types.ObjectId) {
    let user;
    try {
      user = await this.userModel
        .findById(id, {
          _id: 0,
          userId: '$_id',
          name: 1,
          email: 1,
          userRole: 1,
          image: 1,
          status: 1,
        })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        'No Admin User With this ID' + id,
        error,
      );
    }

    if (!user) {
      throw new NotFoundException('The Admin with this id does not exist');
    }

    return user;
  }

  async getAdminByEmail(email: string): Promise<User> {
    let user;

    try {
      user = await this.userModel.findOne({ email });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error connecting to MongoDB',
        error,
      );
    }

    return user;
  }

  async updateAdmin(
    id: MongooseSchema.Types.ObjectId,
    updateAdminDto: UpdateAdminDto,
  ) {
    let user = await this.getAdminUserById(id);

    try {
      if (user) {
        user = {
          name: updateAdminDto.name || user.name,
          email: updateAdminDto.email || user.email,
          userRole: updateAdminDto.userRole || user.userRole,
          status:
            updateAdminDto.status != null ? updateAdminDto.status : user.status,
        };
        user = await this.userModel.findOneAndUpdate({ _id: id }, user, {
          upsert: true,
        });
        if (updateAdminDto.password) {
          user.password = updateAdminDto.password;
          user.save();
        }
      } else {
        throw new NotFoundException('Admin does not exist with this id');
      }
    } catch (error) {
      console.log(error.message);
      throw new InternalServerErrorException('Error in saving DB', error);
    }

    return user;
  }
  async updateRefreshToken(id: string, token: string) {
    try {
      await this.userModel.findByIdAndUpdate(id, {
        $set: { refreshToken: token },
      });
      return { message: 'Successfully updated token' };
    } catch (error) {
      throw new InternalServerErrorException('Error in update data DB', error);
    }
  }
}
