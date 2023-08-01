import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Parser } from 'json2csv';

import { GetQueryDto } from '../dto/getQueryDto';
import { ResponseDto } from '../dto/response.dto';
import { CreateCouponDto } from 'src/modules/coupon/dto/createCoupon.dto';
import { UpdateCouponDto } from 'src/modules/coupon/dto/updateCoupon.dto';
import { CouponFamily } from 'src/entities/coupon.family.model';
import { GeneateCouponDto } from 'src/modules/coupon/dto/generateCoupon.dto';
import { Coupon } from 'src/entities/coupon.model';
import * as voucher_codes from 'voucher-code-generator';
import { Program } from 'src/entities/program.model';
import { Service } from 'src/entities/service.model';
import axios from 'axios';
import { Client } from 'src/entities/client.model';
import * as QRCode from 'qrcode';

export class CouponRespository {
  constructor(
    @InjectModel(CouponFamily.name)
    private readonly couponFamilyModel: Model<CouponFamily>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
    @InjectModel(Program.name)
    private readonly programModel: Model<Program>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<Service>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
  ) {}

  async createCoupon(createCouponDto: CreateCouponDto, session: ClientSession) {
    let coupon;
    try {
      if (!createCouponDto.programId || !createCouponDto.serviceId) {
        const result = await Promise.all([
          this.createProgram(createCouponDto.programName),
          this.createService(createCouponDto.serviceName),
        ]);
        result[0] ? (createCouponDto.programId = result[0]) : '';
        result[1] ? (createCouponDto.serviceId = result[1]) : '';
        coupon = new this.couponFamilyModel({
          familyName: createCouponDto.familyName,
          programId: createCouponDto.programId,
          serviceId: createCouponDto.serviceId,
          noOfCoupons: createCouponDto.noOfCoupons,
        });
        coupon = await coupon.save({ session });
      } else {
        coupon = new this.couponFamilyModel({
          familyName: createCouponDto.familyName,
          programId: createCouponDto.programId,
          serviceId: createCouponDto.serviceId,
          noOfCoupons: createCouponDto.noOfCoupons,
        });
        coupon = await coupon.save({ session });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error in saving DB', error);
    }

    return coupon;
  }

  async getCouponFamilys(query: GetQueryDto) {
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let coupons: CouponFamily[];

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
          ? query.searchColumn == 'programName' ||
            query.searchColumn == 'serviceName'
            ? {
                $match: {
                  $or: [
                    {
                      'program.programName': {
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
                      'service.serviceName': {
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
                    'program.programName': {
                      $regex: query.search,
                      $options: 'i',
                    },
                  },
                  {
                    'service.serviceName': {
                      $regex: query.search,
                      $options: 'i',
                    },
                  },
                ],
              },
            };
      }
      const result = await this.couponFamilyModel.aggregate([
        {
          $lookup: {
            from: 'programs',
            localField: 'programId',
            foreignField: '_id',
            as: 'program',
          },
        },
        { $unwind: '$program' },
        {
          $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: '$service' },
        searchQuery,
        dateRangeQuery,
        {
          $lookup: {
            from: 'coupons',
            let: { couponFamilyId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$couponFamilyId', '$$couponFamilyId'] },
                      { $eq: ['$status', 'REDEEMED'] },
                    ],
                  },
                },
              },
            ],
            as: 'coupons',
          },
        },
        {
          $project: {
            _id: 0,
            couponFamilyId: '$_id',
            familyName: 1,
            program: {
              programId: '$program._id',
              programName: '$program.programName',
            },
            service: {
              serviceId: '$service._id',
              serviceName: '$service.serviceName',
            },
            noOfCoupons: 1,
            status: { $cond: ['$status', '$status', false] },
            redemeedDate: new Date(),
<<<<<<< Updated upstream
            noOfUsedCoupons: { $size: '$coupons' },
=======
            noOfUsedCoupons: { $cond: ['$noOfCoupons', 0, 0] },
>>>>>>> Stashed changes
          },
        },
        {
          $facet: {
            couponList: [{ $skip: skip }, { $limit: limit }],
            nTotal: [
              {
                $count: 'count',
              },
            ],
          },
        },
      ]);

      let response: ResponseDto;
      const { couponList, nTotal } = result[0];
      coupons = couponList;
      if (coupons.length > 0) {
        response = {
          ok: true,
          data: coupons,
          message: 'Get Coupon Data Success!',
          page,
          limit,
          nTotal: nTotal[0] ? nTotal[0].count : 0,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No Coupon User Exist',
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

  async getCouponFamilyById(id: string, query: GetQueryDto) {
    let couponFamily;
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;
    try {
      let searchQuery = {
        $match: {},
      };
      if (query.search) {
        searchQuery =
          query.searchColumn && query.searchColumn == 'programName'
            ? {
                $match: {
                  $or: [
                    {
                      'program.programName': {
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
                      'program.programName': {
                        $regex: query.search,
                        $options: 'i',
                      },
                    },
                    {
                      'program.programName': {
                        $regex: query.search,
                        $options: 'i',
                      },
                    },
                    {
                      'clients.name': {
                        $regex: query.search,
                        $options: 'i',
                      },
                    },
                  ],
                },
              };
      }
      let advancedStateSearch = {
        $match: {},
      };
      let advancedRegionSearch = {
        $match: {},
      };
      let advancedCouponSearch = {
        $match: {},
      };
      let advancedRedemeedSearch = {
        $match: {},
      };
      if (
        query.state ||
        query.region ||
        query.couponStatus ||
        query.redemeedStatus
      ) {
        if (query.state) {
          advancedStateSearch = {
            $match: {
              'clients.state.stateName': query.state,
            },
          };
        }
        if (query.region) {
          advancedRegionSearch = {
            $match: {
              'clients.region.regionName': query.region,
            },
          };
        }
        if (query.couponStatus) {
          advancedCouponSearch = {
            $match: {
              status: { $in: query.couponStatus.split(',') },
            },
          };
        }
        if (query.redemeedStatus != null && query.redemeedStatus != undefined) {
          advancedRedemeedSearch = query.redemeedStatus
            ? {
                $match: {
                  status: 'REDEMEED',
                },
              }
            : {
                $match: {
                  status: { $ne: 'REDEMEED' },
                },
              };
        }
      }
      const result = await this.couponModel.aggregate([
        {
          $match: {
            couponFamilyId: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'couponfamilies',
            localField: 'couponFamilyId',
            foreignField: '_id',
            as: 'couponfamily',
          },
        },
        { $unwind: '$couponfamily' },
        {
          $lookup: {
            from: 'programs',
            localField: 'couponfamily.programId',
            foreignField: '_id',
            as: 'program',
          },
        },
        { $unwind: '$program' },
        {
          $lookup: {
            from: 'services',
            localField: 'couponfamily.serviceId',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: '$service' },
        advancedRedemeedSearch,
        advancedCouponSearch,
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
            ],
            as: 'clients',
          },
        },
        { $unwind: '$clients' },
        searchQuery,
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        advancedRegionSearch,
        advancedStateSearch,
        {
          $project: {
            _id: 0,
            couponId: '$_id',
            couponCode: 1,
            couponFamily: {
              couponFamilyId: '$couponFamilyId',
              familyName: '$couponfamily.familyName',
            },
            program: {
              programId: '$program._id',
              programName: '$program.programName',
            },
            service: {
              serviceId: '$service._id',
              serviceName: '$service.serviceName',
            },
            redemeedDate: {
              $cond: ['$redemeedDate', '$redemeedDate', '-'],
            },
            validFrom: 1,
            validTo: 1,
            status: 1,
            client: '$clients',
            doctor: {
              $cond: [
                { $size: '$doctor' },
                { $arrayElemAt: ['$doctor', 0] },
                {},
              ],
            },
          },
        },
        {
          $facet: {
            couponList: [{ $skip: skip }, { $limit: limit }],
            nTotal: [
              {
                $count: 'count',
              },
            ],
          },
        },
      ]);

      let response: ResponseDto;
      const { couponList, nTotal } = result[0];
      couponFamily = couponList;
      if (couponFamily.length > 0) {
        response = {
          ok: true,
          data: couponFamily,
          message: 'Get Coupon Data Success!',
          page,
          limit,
          nTotal: nTotal[0] ? nTotal[0].count : 0,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No Coupon User Exist',
          page,
          limit,
          nTotal: 0,
        };
      }
      return response;
    } catch (error) {
      throw new InternalServerErrorException(
        'No Coupon User With this ID' + id,
        error,
      );
    }

    if (!couponFamily.length) {
      throw new NotFoundException('The Coupon with this id does not exist');
    }
  }

  async updateCoupon(updtaeCouponDto: UpdateCouponDto, couponId: string) {
    try {
      if (!updtaeCouponDto.programId || !updtaeCouponDto.serviceId) {
        const result = await Promise.all([
          this.createProgram(updtaeCouponDto.programName),
          this.createService(updtaeCouponDto.serviceName),
        ]);
        result[0] ? (updtaeCouponDto.programId = result[0]) : '';
        result[1] ? (updtaeCouponDto.serviceId = result[1]) : '';
      }
      if (updtaeCouponDto.status == null) {
        updtaeCouponDto.status = true;
      }
      const couponFamily = await this.couponFamilyModel.findByIdAndUpdate(
        couponId,
        {
          $set: updtaeCouponDto,
        },
        {
          $upsert: true,
        },
      );
      return couponFamily;
    } catch (error) {
      throw new InternalServerErrorException('Error in saving DB', error);
    }
  }

  async generateCoupon(
    geneateCouponDto: GeneateCouponDto,
    session: ClientSession,
  ) {
    const generatedCode = voucher_codes.generate({
      length: 8,
      count: 1,
    })[0];
    let coupon = new this.couponModel({
      couponCode: generatedCode + '',
      clinicId: geneateCouponDto.clinicId,
      couponFamilyId: geneateCouponDto.couponFamilyId,
      validFrom: geneateCouponDto.validFrom || geneateCouponDto.date[0],
      validTo: geneateCouponDto.validTo || geneateCouponDto.date[1],
      userId: geneateCouponDto.userId,
    });

    try {
      QRCode.toFile(
        process.cwd() + '/public/' + generatedCode + '.png',
        generatedCode + '',
        (err) => {
          if (err) throw err;
          this.sendSMS(
            geneateCouponDto.userId,
            generatedCode +
              ' . ' +
              'https://stg-admin.fh.careconnectmyanmar.com/public/' +
              generatedCode +
              '.png',
          );
        },
      );

      coupon = await coupon.save({ session });
    } catch (error) {
      console.log(error.message);

      throw new InternalServerErrorException('Error in saving DB', error);
    }

    return coupon;
  }
  async getServiceNameSearch(serviceName: string) {
    try {
      const couponFamily = await this.couponFamilyModel.aggregate([
        {
          $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: '$service' },
        {
          $match: {
            familyName: {
              $regex: serviceName,
              $options: 'i',
            },
          },
        },
        {
          $lookup: {
            from: 'programs',
            localField: 'programId',
            foreignField: '_id',
            as: 'program',
          },
        },
        { $unwind: '$program' },
      ]);
      if (couponFamily) {
        return {
          ok: true,
          data: couponFamily,
        };
      } else {
        return {
          ok: true,
          data: [],
        };
      }
    } catch (error) {
      console.log(error);
      throw new NotFoundException(
        `Coupon Family Not found with this serviceName ${serviceName}`,
      );
    }
  }
  async updateCouponStatus(status: boolean, id: string) {
    try {
      const coupon = await this.couponModel.findByIdAndUpdate(id, {
        $set: {
          status: status,
        },
      });
      return coupon;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async createProgram(programName: string) {
    try {
      if (programName) {
        const program = new this.programModel({ programName });
        await program.save();
        return program._id;
      } else {
        return null;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async createService(serviceName: string) {
    try {
      if (serviceName) {
        const service = new this.serviceModel({ serviceName });
        await service.save();
        return service._id;
      } else {
        return null;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async getAutoCompleteProgram(programName: string) {
    try {
      const program = await this.programModel.find({
        programName: {
          $regex: programName,
          $options: 'i',
        },
      });
      const response = {
        ok: true,
        data: program,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async getAutoCompleteService(serviceName: string) {
    try {
      const service = await this.serviceModel.find({
        serviceName: {
          $regex: serviceName,
          $options: 'i',
        },
      });
      const response = {
        ok: true,
        data: service,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async getRedemeedCouponInformation(getQueryDto: GetQueryDto) {
    try {
      let page = getQueryDto.page || 1;
      page = Number(page);

      let limit = getQueryDto.limit || 10;
      limit = Number(limit);

      const skip = (page - 1) * limit;
      let searchQuery = {
        $match: {},
      };
      if (getQueryDto.search) {
        searchQuery = getQueryDto.searchColumn
          ? getQueryDto.searchColumn == 'clientName'
            ? {
                $match: {
                  $or: [
                    {
                      clientName: {
                        $regex: getQueryDto.search,
                        $options: 'i',
                      },
                    },
                  ],
                },
              }
            : getQueryDto.searchColumn == 'clinicName'
            ? {
                $match: {
                  $or: [
                    {
                      clinicName: {
                        $regex: getQueryDto.search,
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
                      doctorName: {
                        $regex: getQueryDto.search,
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
                    clientName: {
                      $regex: getQueryDto.search,
                      $options: 'i',
                    },
                  },
                  {
                    clinicName: {
                      $regex: getQueryDto.search,
                      $options: 'i',
                    },
                  },
                  {
                    doctorName: {
                      $regex: getQueryDto.search,
                      $options: 'i',
                    },
                  },
                ],
              },
            };
      }
      let dateRangeQuery = {
        $match: {},
      };

      if (getQueryDto.startDate && getQueryDto.endDate) {
        dateRangeQuery = {
          $match: {
            createdAt: {
              $gte: new Date(getQueryDto.startDate),
              $lt: new Date(getQueryDto.endDate),
            },
          },
        };
      }
      const result = await this.couponModel.aggregate([
        {
          $match: {
            redemeedDate: { $ne: null },
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
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
          $lookup: {
            from: 'clinics',
            localField: 'clinicId',
            foreignField: '_id',
            as: 'clinic',
          },
        },
        { $unwind: '$clinic' },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        dateRangeQuery,
        {
          $project: {
            _id: 0,
            couponCode: 1,
            clinicName: '$clinic.clinicName',
            clientName: '$client.name',
            doctorName: '$doctor.name',
            cgDate: '$createdAt',
            crDate: '$redemeedDate',
          },
        },
        searchQuery,
        {
          $facet: {
            couponList: [{ $skip: skip }, { $limit: limit }],
            nTotal: [
              {
                $count: 'count',
              },
            ],
          },
        },
      ]);
      const { couponList, nTotal } = result[0];
      return {
        ok: true,
        data: couponList,
        nTotal: nTotal.length ? nTotal[0].count : 0,
        page: page,
        limit: limit,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async exportRedemeedCouponInformation(getQueryDto: GetQueryDto) {
    try {
      let searchQuery = {
        $match: {},
      };
      if (getQueryDto.search) {
        searchQuery = getQueryDto.searchColumn
          ? getQueryDto.searchColumn == 'clientName'
            ? {
                $match: {
                  $or: [
                    {
                      clientName: {
                        $regex: getQueryDto.search,
                        $options: 'i',
                      },
                    },
                  ],
                },
              }
            : getQueryDto.searchColumn == 'clinicName'
            ? {
                $match: {
                  $or: [
                    {
                      clinicName: {
                        $regex: getQueryDto.search,
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
                      doctorName: {
                        $regex: getQueryDto.search,
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
                    clientName: {
                      $regex: getQueryDto.search,
                      $options: 'i',
                    },
                  },
                  {
                    clinicName: {
                      $regex: getQueryDto.search,
                      $options: 'i',
                    },
                  },
                  {
                    doctorName: {
                      $regex: getQueryDto.search,
                      $options: 'i',
                    },
                  },
                ],
              },
            };
      }
      let dateRangeQuery = {
        $match: {},
      };

      if (getQueryDto.startDate && getQueryDto.endDate) {
        dateRangeQuery = {
          $match: {
            createdAt: {
              $gte: new Date(getQueryDto.startDate),
              $lt: new Date(getQueryDto.endDate),
            },
          },
        };
      }

      const csvFields = [
        'couponCode',
        'clinicName',
        'age',
        'phoneNumber',
        'region',
        'township',
        'gestrationMonth',
        'clientName',
        'doctorName',
        'serviceCategory',
        'cgDate',
        'crDate',
      ];
      const result = await this.couponModel.aggregate([
        {
          $match: {
            status: 'REDEEMED',
          },
        },
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
            ],
            as: 'client',
          },
        },
        { $unwind: '$client' },
        {
          $lookup: {
            from: 'clinics',
            localField: 'clinicId',
            foreignField: '_id',
            as: 'clinic',
          },
        },
        { $unwind: '$clinic' },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        dateRangeQuery,
        {
          $project: {
            _id: 0,
            couponCode: 1,
            clinicName: '$clinic.name',
            age: {
              $cond: [
                '$client.age',
                '$client.age',
                {
                  $dateDiff: {
                    startDate: '$client.dateOfBirth',
                    endDate: '$$NOW',
                    unit: 'year',
                  },
                },
              ],
            },
            phoneNumber: '$client.phoneNumber',
            region: '$client.region.regionName',
            township: '$client.state.stateName',
            geastralMonth: '$client.geastralMonth',
            clientName: '$client.name',
            doctorName: '$doctor.name',
            serviceCategory: { $cond: ['$category', '$category', '-'] },
            cgDate: '$createdAt',
            crDate: '$redemeedDate',
          },
        },
        searchQuery,
      ]);
      const json2csvParser = new Parser({ csvFields });
      const csv = json2csvParser.parse(result);
      return csv;
    } catch (error) {
      throw error;
    }
  }
  async sendSMS(userId: string, message: string) {
    try {
      const client = await this.clientModel.findById(userId);
      const data = {
        to: client ? client.phoneNumber : '09407943675',
        message: `Your coupon code is ${message}. You can claim once at clinic.`,
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
