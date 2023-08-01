import { InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetQueryDto } from '../dto/getQueryDto';
import { Client } from '../entities/client.model';
import { ResponseDto } from 'src/dto/response.dto';
import { Coupon } from 'src/entities/coupon.model';
import { Clinic } from 'src/entities/clinic.model';

export class DashboardRespository {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>, //
    @InjectModel(Coupon.name) //
    private readonly couponModel: Model<Coupon>, //
    @InjectModel(Clinic.name) //
    private readonly clinicModel: Model<Clinic>,
  ) {}

  async getPatientCouponCountInfo(query: GetQueryDto) {
    try {
      let response: ResponseDto;
      response = response = {
        ok: true,
        data: {
          todayCouponInfo: {
            redemeedCount: 650,
            pendingCount: 350,
            totalCount: 1000,
            redemeedPercentage: '65%',
          },
          patientCount: {
            type: query.type || 'Weekly',
            newCount: 10000,
            totalCount: 30000,
            treatCount: 1000,
            neverRedmeed: 3000,
          },
          couponInfo: {
            generatedCount: 10000,
            redemeedCount: 5000,
            cancelCount: 3000,
            redemeedPercentage: '50%',
            cancelPercentage: '30%',
          },
        },
        message: 'Get Data Success!',
      };
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const result = await Promise.all([
        this.couponModel.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              title: '$_id',
              count: 1,
            },
          },
        ]),
        this.couponModel.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              title: '$_id',
              count: 1,
            },
          },
        ]),
        this.clientModel.aggregate([
          {
            $addFields: {
              type: { $week: '$updatedAt' },
            },
          },

          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
          {
            $match: {
              $expr: {
                $eq: [{ $week: new Date() }, '$_id'],
              },
            },
          },
          {
            $project: {
              _id: 1,
              count: 1,
            },
          },
        ]),
      ]);
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }

  async getCouponInfoGraph(getQueryDto: GetQueryDto) {
    try {
      getQueryDto.region = getQueryDto.region ? getQueryDto.region : 'Yangon';
      const clinicCouponGraphData = await this.couponModel.aggregate([
        {
          $lookup: {
            from: 'clients',
            let: { userId: '$userId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
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
                  regionName: '$region.regionName',
                  stateName: '$state.stateName',
                },
              },
            ],
            as: 'client',
          },
        },
        { $unwind: '$client' },

        {
          $match: {
            'client.regionName': {
              $regex: getQueryDto.region,
              $options: 'i',
            },
          },
        },
        {
          $group: {
            _id: '$client.stateName',
            clinic: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            title: '$_id',
            clinic: 1,
          },
        },
      ]);
      const response = {
        ok: true,
        data: clinicCouponGraphData,
        message: ' Get Data Success',
      };
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }

  async getClientInfoByAgeGroup() {
    try {
      const ageGpData = await this.clientModel.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $lt: ['$age', 21] },
                'Age 15-20',
                {
                  $cond: [
                    { $lt: ['$age', 31] },
                    'Age 21-30',
                    {
                      $cond: [{ $lt: ['$age', 41] }, 'Age 31-40', 'Age 41-50'],
                    },
                  ],
                },
              ],
            },
            userList: { $push: '$_id' },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'coupons',
            localField: 'userList',
            foreignField: 'userId',
            as: 'coupon',
          },
        },
        {
          $addFields: {
            generatedCount: { $size: '$coupon' },
            redemmedCound: {
              $reduce: {
                input: '$coupon',
                initialValue: 0,
                in: {
                  $cond: {
                    if: { $eq: ['$$this.status', 'REDEEMED'] },
                    then: { $sum: 1 },
                    else: 0,
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            title: '$_id',
            generatedCount: 1,
            redemmedCound: 1,
            percentage: {
              $multiply: [
                {
                  $divide: [
                    '$redemmedCound',
                    { $cond: ['$generatedCount', '$generatedCount', 1] },
                  ],
                },
                100,
              ],
            },
          },
        },
      ]);
      const response = {
        ok: true,
        data: ageGpData,
        message: 'Get Data Success',
      };
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }

  async getClinicCountGraph(getQueryDto: GetQueryDto) {
    try {
      // const response = {
      //   ok: true,
      //   data:
      //     getQueryDto.region == 'Ayeyarwady'
      //       ? {
      //           totalClinic: 100,
      //           redemeed: 98,
      //           unRedemeed: 2,
      //           graphData: [
      //             {
      //               name: 'Bogale',
      //               clinic: 400,
      //             },
      //             {
      //               name: 'Pyapon',
      //               clinic: 100,
      //             },
      //             {
      //               name: 'Maubin',
      //               clinic: 200,
      //             },
      //             {
      //               name: 'Wakema',
      //               clinic: 100,
      //             },
      //             {
      //               name: 'Myaungmya',
      //               clinic: 190,
      //             },
      //             {
      //               name: 'Pathein',
      //               clinic: 150,
      //             },
      //           ],
      //         }
      //       : getQueryDto.region == 'Bago'
      //       ? {
      //           totalClinic: 100,
      //           redemeed: 98,
      //           unRedemeed: 2,
      //           graphData: [
      //             {
      //               name: 'Bago',
      //               clinic: 4000,
      //             },
      //             {
      //               name: 'Kyauktaga',
      //               clinic: 3000,
      //             },
      //             {
      //               name: 'Pyay',
      //               clinic: 1200,
      //             },
      //             {
      //               name: 'Nyaunglebin',
      //               clinic: 2780,
      //             },
      //             {
      //               name: 'Taungoo',
      //               clinic: 0,
      //             },
      //           ],
      //         }
      //       : {
      //           totalClinic: 100,
      //           redemeed: 98,
      //           unRedemeed: 2,
      //           graphData: [
      //             {
      //               name: 'Hlaingthayar',
      //               clinic: 4000,
      //             },
      //             {
      //               name: 'Hlegu',
      //               clinic: 3000,
      //             },
      //             {
      //               name: 'Thanlyn',
      //               clinic: 1200,
      //             },
      //             {
      //               name: 'Dagon Myothit (South)',
      //               clinic: 2780,
      //             },
      //             {
      //               name: 'Hmawbi',
      //               clinic: 0,
      //             },
      //             {
      //               name: 'Shwepyithar',
      //               clinic: 100,
      //             },
      //             {
      //               name: 'Kyauktan',
      //               clinic: 100,
      //             },
      //             {
      //               name: 'Dala',
      //               clinic: 100,
      //             },
      //             {
      //               name: 'Tharketa',
      //               clinic: 100,
      //             },
      //           ],
      //         },
      //   message: 'Get Data Success',
      // };
      const clinicCounGraphData = await this.clinicModel.aggregate([
        {
          $match: {
            regionName: {
              $regex: getQueryDto.region,
              $options: 'i',
            },
          },
        },
        {
          $lookup: {
            from: 'states',
            let: { region: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$region', '$$region'] },
                },
              },
              {
                $lookup: {
                  from: 'clinics',
                  localField: '_id',
                  foreignField: 'stateId',
                  as: 'clinics',
                },
              },
              {
                $project: {
                  name: '$stateName',
                  clinics: { $size: '$clinics' },
                },
              },
            ],
            as: 'graphData',
          },
        },
      ]);
      const response = {
        ok: true,
        data: clinicCounGraphData,
        message: 'Get Data Success',
      };
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }
}
