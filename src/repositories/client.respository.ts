import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import {
  ClientSession,
  Model,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';
import { GetQueryDto } from '../dto/getQueryDto';
import { ResponseDto } from '../dto/response.dto';
import { Client } from '../entities/client.model';
import { CreateClientDto } from 'src/modules/client/dto/createClient.dto';
import { UpdateClientDto } from 'src/modules/client/dto/updateClient.dto';
import { Region } from 'src/entities/region.model';
import { State } from 'src/entities/state.model';
import { Coupon } from 'src/entities/coupon.model';

const publicKey = fs.readFileSync('./src/config/jwtRS256.key.pub', 'utf8');
export class ClientRespository {
  constructor(
    @InjectModel(Client.name)
    private readonly userModel: Model<Client>,
    @InjectModel(Region.name)
    private readonly regionModel: Model<Region>,
    @InjectModel(State.name)
    private readonly stateModel: Model<State>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
  ) {}

  async createClient(createClientDto: CreateClientDto, session: ClientSession) {
    let user = await this.getClientByPhoneNumber(createClientDto.phoneNumber);

    if (user) {
      throw new ConflictException('Client Already Exists!');
    }
    if (!createClientDto.dateOfBirth) {
      const updatedYear =
        new Date().getUTCFullYear() - parseInt(createClientDto.age);
      createClientDto.dateOfBirth = new Date(
        new Date().setUTCFullYear(updatedYear),
      ).toISOString();
    }
    const regionId = await this.getRegionByRegionName(createClientDto.state);
    const stateId = await this.getTownshipByTownshipName(
      createClientDto.township,
    );
    user = new this.userModel({
      name: createClientDto.name,
      phoneNumber: createClientDto.phoneNumber,
      age: createClientDto.age || 0,
      pragrancyStatus: createClientDto.pragrancyStatus || false,
      noOfChildren: createClientDto.noOfChildren || 0,
      geastralMonth: createClientDto.geastralMonth || 0,
      status: createClientDto.status || true,
      dateOfBirth: createClientDto.dateOfBirth || new Date().toISOString(),
      stateId: stateId,
      regionId: regionId,
    });
    try {
      user = await user.save({ session });
    } catch (error) {
      throw new InternalServerErrorException('Error in saving DB', error);
    }

    return user;
  }

  async getClientUsers(token: string, query: GetQueryDto) {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    });
    const { userId, userRole } = decoded;
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let users: Client[];

    try {
      let searchQuery = {
        $match: {},
      };
      let dateRangeQuery = {
        $match: {},
      };
      let dateRangeQueryC = {
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
        dateRangeQueryC = {
          $match: {
            redemeedDate: {
              $gte: new Date(query.startDate),
              $lt: new Date(query.endDate),
            },
          },
        };
      }
      if (query.search) {
        searchQuery = query.searchColumn
          ? query.searchColumn == 'name' || query.searchColumn == 'clientName'
            ? {
                $match: {
                  name: {
                    $regex: query.search,
                    $options: 'i',
                  },
                },
              }
            : {
                $match: {
                  phoneNumber: {
                    $regex: query.search,
                    $options: 'i',
                  },
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
                    phoneNumber: {
                      $regex: query.search,
                      $options: 'i',
                    },
                  },
                ],
              },
            };
      }
      const result =
        userRole != 'CLINIC'
          ? await this.userModel.aggregate([
              {
                $sort: {
                  _id: -1,
                },
              },
              {
                $lookup: {
                  from: 'coupons',
                  let: { userId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$userId', '$$userId'] },
                      },
                    },
                  ],
                  as: 'coupons',
                },
              },
              {
                $lookup: {
                  from: 'coupons',
                  let: { userId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$userId', '$$userId'] },
                            { $eq: ['$status', 'REDEEMED'] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'redeemeds',
                },
              },
              dateRangeQuery,
              {
                $project: {
                  _id: 0,
                  userId: '$_id',
                  name: 1,
                  phoneNumber: 1,
                  age: {
                    $cond: [
                      '$age',
                      '$age',
                      {
                        $dateDiff: {
                          startDate: '$dateOfBirth',
                          endDate: '$$NOW',
                          unit: 'year',
                        },
                      },
                    ],
                  },
                  pragrancyStatus: 1,
                  noOfChildren: 1,
                  geastralMonth: 1,
                  dateOfBirth: 1,
                  status: {
                    $cond: ['$status', '$status', false],
                  },
                  generateCount: { $size: '$coupons' },
                  redemeedCount: { $size: '$redeemeds' },
                },
              },
              searchQuery,
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
            ])
          : await this.couponModel.aggregate([
              {
                $match: {
                  clinicId: new Types.ObjectId(userId),
                },
              },
              {
                $sort: {
                  _id: -1,
                },
              },
              dateRangeQueryC,
              {
                $lookup: {
                  from: 'clients',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'client',
                },
              },
              { $unwind: '$client' },
              {
                $project: {
                  _id: 0,
                  couponId: '$_id',
                  couponCode: 1,
                  name: '$client.name',
                  dateOfBirth: '$client.dateOfBirth',
                  status: 1,
                  doctorComment: 1,
                  date: '$redemeedDate',
                  category: { $cond: ['$category', '$category', ''] },
                },
              },
              searchQuery,
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
          message: 'Get Client Data Success!',
          page,
          limit,
          nTotal: nTotal[0] ? nTotal[0].count : 0,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No Client User Exist',
          page,
          limit,
          nTotal: 0,
        };
      }
      return response;
    } catch (error) {
      console.log(error.message);

      throw new InternalServerErrorException('Error DB GET', error);
    }
  }

  async getClientUserById(id: string) {
    let user;
    try {
      user = await this.userModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'regions',
            localField: 'regionId',
            foreignField: '_id',
            as: 'region',
          },
        },
        { $unwind: '$region' },
        {
          $lookup: {
            from: 'states',
            localField: 'stateId',
            foreignField: '_id',
            as: 'state',
          },
        },
        { $unwind: '$state' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: 1,
            phoneNumber: 1,
            age: 1,
            pragrancyStatus: 1,
            noOfChildren: 1,
            geastralMonth: 1,
            dateOfBirth: 1,
            state: '$region.regionName',
            township: '$state.stateName',
          },
        },
      ]);

      // .findById(id, {
      //   _id: 0,
      //   userId: '$_id',
      //   name: 1,
      //   phoneNumber: 1,
      //   age: 1,
      //   pragrancyStatus: 1,
      //   noOfChildren: 1,
      //   geastralMonth: 1,
      //   dateOfBirth: 1,
      //   state: '$regionId.regionName',
      //   township: '$stateId.stateName',
      // })
      // .populate({
      //   path: 'regionId',
      //   options: { strictPopulate: false },
      // })
      // .populate({
      //   path: 'stateId',
      //   options: { strictPopulate: false },
      // })
      // .exec();
    } catch (error) {
      console.log(error.message);
      throw new InternalServerErrorException(
        'No Client User With this ID' + id,
        error,
      );
    }

    if (!user.length) {
      throw new NotFoundException('The Client with this id does not exist');
    }

    return user[0];
  }

  async getClientByPhoneNumber(phoneNumber: string): Promise<Client> {
    const user = await this.userModel.findOne(
      { phoneNumber, status: true },
      {
        _id: 0,
        userId: '$_id',
        name: 1,
        age: 1,
        dateOfBirth: 1,
        geastralMonth: 1,
        noOfChildren: 1,
        phoneNumber: 1,
      },
    );
    if (user) {
      return user;
    } else {
      throw new NotFoundException(
        `Client with this phone number does't exist or it will be disable account`,
      );
    }

    return user;
  }

  async updateClient(
    id: MongooseSchema.Types.ObjectId,
    updtaeClientDto: UpdateClientDto,
  ) {
    let user = await this.userModel.findOne({ _id: id });

    try {
      if (user) {
        if (!updtaeClientDto.dateOfBirth) {
          const updatedYear =
            new Date().getUTCFullYear() - parseInt(updtaeClientDto.age);
          updtaeClientDto.dateOfBirth = new Date(
            new Date().setUTCFullYear(updatedYear),
          ).toISOString();
        }
        const regionId = await this.getRegionByRegionName(
          updtaeClientDto.state,
        );
        const stateId = await this.getTownshipByTownshipName(
          updtaeClientDto.township,
        );
        console.log(regionId);
        console.log(stateId);
        const updateClientData = {
          name: updtaeClientDto.name || user.name,
          phoneNumber: updtaeClientDto.phoneNumber || user.phoneNumber,
          age: parseInt(updtaeClientDto.age) || user.age,
          pragrancyStatus:
            updtaeClientDto.pragrancyStatus || user.pragrancyStatus,
          noOfChildren: updtaeClientDto.noOfChildren || user.noOfChildren,
          geastralMonth: updtaeClientDto.geastralMonth || user.geastralMonth,
          status:
            updtaeClientDto.status != null
              ? updtaeClientDto.status
              : user.status,
          dateOfBirth: updtaeClientDto.dateOfBirth || new Date().toISOString(),
          stateId: stateId || user.stateId,
          regionId: regionId || user.regionId,
        };
        user = await this.userModel.findOneAndUpdate(
          { _id: id },
          updateClientData,
          {
            upsert: true,
          },
        );
        return user;
      } else {
        throw new NotFoundException('Client does not exist with this id');
      }
    } catch (error) {
      throw new InternalServerErrorException('Error in saving DB', error);
    }
  }

  async getRegionByRegionName(regionName: string) {
    try {
      console.log(regionName);

      const region = await this.regionModel.findOne({
        regionName: {
          $regex: regionName,
          $options: 'i',
        },
      });
      return region ? region._id : null;
    } catch (error) {
      return null;
    }
  }

  async getTownshipByTownshipName(townshipName: string) {
    try {
      const region = await this.stateModel.findOne({
        stateName: {
          $regex: townshipName,
          $options: 'i',
        },
      });
      return region ? region._id : null;
    } catch (error) {
      return null;
    }
  }
}
