import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Model,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { GetQueryDto } from '../dto/getQueryDto';
import { ResponseDto } from '../dto/response.dto';
import { Clinic } from '../entities/clinic.model';
import { CreateClinicDto } from 'src/modules/clinic/dto/createClinic.dto';
import { UpdateClinicDto } from 'src/modules/clinic/dto/updateClinic.dto';
import { Doctor } from 'src/entities/doctor.model';
import { DoctorDto } from 'src/modules/clinic/dto/doctor.dto';
import { LoginClinicDto } from 'src/modules/clinic/dto/loginClinic.dto';
import { Coupon } from 'src/entities/coupon.model';
import { RedeemedCouponDto } from 'src/modules/clinic/dto/redeemedCoupon.dto';
import { ChangePassword } from 'src/modules/clinic/dto/changePassword.dto';
import { Region } from 'src/entities/region.model';
import { State } from 'src/entities/state.model';
const privateKey = fs.readFileSync(
  process.cwd() + '/src/config/jwtRS256.key',
  'utf-8',
);
const publicKey = fs.readFileSync('./src/config/jwtRS256.key.pub', 'utf8');

export class ClinicRespository {
  constructor(
    @InjectModel(Clinic.name)
    private readonly clinicModel: Model<Clinic>,
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<Doctor>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
    @InjectModel(Region.name)
    private readonly regionModel: Model<Region>,
    @InjectModel(State.name)
    private readonly stateModel: Model<State>,
  ) {}

  async createClinic(createClinicDto: CreateClinicDto, session: ClientSession) {
    let clinic = await this.getClinicByPhoneNumber(createClinicDto.phoneNumber);

    if (clinic) {
      throw new ConflictException('Clinic Already Exists!');
    }
    const regionId = await this.getRegionByRegionName(createClinicDto.state);
    const stateId = await this.getTownshipByTownshipName(
      createClinicDto.township,
    );
    clinic = new this.clinicModel({
      clinicName: createClinicDto.clinicName,
      phoneNumber: createClinicDto.phoneNumber,
      email: createClinicDto.email || '',
      clinicJoinDate: createClinicDto.clinicJoinDate || new Date(),
      status: createClinicDto.status || true,
      doctors: [],
      password: 'user@123',
      regionId,
      stateId,
    });

    try {
      const doctors = await Promise.all(
        createClinicDto.doctors.map(async (d) => {
          const doc = await this.createDoctor(d, session, clinic._id);
          console.log('Done create doc');

          return doc._id;
        }),
      );
      console.log(doctors);
      clinic.doctors = doctors.length ? doctors : [];
      clinic = await clinic.save({ session });
    } catch (error) {
      console.log(error.message);

      throw new InternalServerErrorException(error.message);
    }

    return clinic;
  }

  async getClinics(query: GetQueryDto) {
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let clinics: Clinic[];

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
          ? query.searchColumn == 'clinicName'
            ? {
                $match: {
                  $or: [
                    {
                      clinicName: {
                        $regex: query.search,
                        $options: 'i',
                      },
                    },
                  ],
                },
              }
            : query.searchColumn == 'phoneNumber'
            ? {
                $match: {
                  $or: [
                    {
                      phoneNumber: {
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
                    clinicName: {
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
      const result = await this.clinicModel.aggregate([
        searchQuery,
        dateRangeQuery,
        {
          $lookup: {
            from: 'doctors',
            let: { doctors: '$doctors' },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$_id', '$$doctors'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  userId: '$_id',
                  name: 1,
                  samaId: '$samaID',
                  gender: 1,
                  academicTitle: 1,
                  medicalDegree: 1,
                  phoneNumber: 1,
                  status: 1,
                },
              },
            ],
            as: 'doctors',
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        {
          $project: {
            _id: 0,
            clinicId: '$_id',
            clinicName: 1,
            phoneNumber: 1,
            email: 1,
            clinicJoinDate: 1,
            doctors: 1,
            status: {
              $cond: ['$status', '$status', false],
            },
          },
        },
        {
          $facet: {
            clinicList: [{ $skip: skip }, { $limit: limit }],
            nTotal: [
              {
                $count: 'count',
              },
            ],
          },
        },
      ]);
      let response: ResponseDto;
      const { clinicList, nTotal } = result[0];
      clinics = clinicList;
      if (clinics.length > 0) {
        response = {
          ok: true,
          data: clinics,
          message: 'Get Clinic Data Success!',
          page,
          limit,
          nTotal: nTotal[0] ? nTotal[0].count : 0,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No Clinic Exist',
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

  async getClinicById(id: string) {
    let clinic;
    try {
      clinic = await this.clinicModel.aggregate([
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
        {
          $lookup: {
            from: 'states',
            localField: 'stateId',
            foreignField: '_id',
            as: 'state',
          },
        },
        {
          $lookup: {
            from: 'doctors',
            let: { doctors: '$doctors' },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$_id', '$$doctors'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  samaId: '$samaID',
                  academicTitle: 1,
                  medicalDegree: 1,
                  gender: 1,
                  image: 1,
                  status: 1,
                  clinicId: 1,
                  updatedAt: 1,
                  createdAt: 1,
                  phoneNumber: { $cond: ['$phoneNumber', '$phoneNumber', '-'] },
                  __v: 1,
                },
              },
            ],
            as: 'doctors',
          },
        },
        {
          $addFields: {
            state: {
              $cond: [
                { $size: '$region' },
                { $arrayElemAt: ['$region', 0] },
                { regionName: '' },
              ],
            },
            township: {
              $cond: [
                { $size: '$state' },
                { $arrayElemAt: ['$state', 0] },
                { stateName: '' },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            clinicId: '$_id',
            clinicName: 1,
            phoneNumber: 1,
            email: 1,
            clinicJoinDate: 1,
            doctors: 1,
            state: '$state.regionName',
            township: '$township.stateName',
          },
        },
      ]);
    } catch (error) {
      throw new InternalServerErrorException(
        'No Client User With this ID' + id,
        error,
      );
    }

    if (!clinic.length) {
      throw new NotFoundException('The Clinic with this id does not exist');
    }

    return clinic[0];
  }

  async getClinicByPhoneNumber(phoneNumber: string): Promise<Clinic> {
    let clinic;

    try {
      clinic = await this.clinicModel.findOne({ phoneNumber });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error connecting to MongoDB',
        error,
      );
    }

    return clinic;
  }

  async updateClinic(
    id: MongooseSchema.Types.ObjectId,
    updtaeClinicDto: UpdateClinicDto,
    session: ClientSession,
  ) {
    let clinic = await this.clinicModel.findOne({ _id: id });

    const regionId = await this.getRegionByRegionName(updtaeClinicDto.state);
    const stateId = await this.getTownshipByTownshipName(
      updtaeClinicDto.township,
    );
    const doctors = await Promise.all(
      updtaeClinicDto.doctors.map(async (d) => {
        const doc = await this.createDoctor(d, session, id);
        return doc._id;
      }),
    );

    const updateClinicData = {
      clinicName: updtaeClinicDto.clinicName || clinic.clinicName,
      phoneNumber: updtaeClinicDto.phoneNumber || clinic.phoneNumber,
      email: updtaeClinicDto.email || clinic.email,
      clinicJoinDate:
        new Date(updtaeClinicDto.clinicJoinDate) || clinic.clinicJoinDate,
      doctors: doctors || clinic.doctors,
      status:
        updtaeClinicDto.status != null ? updtaeClinicDto.status : clinic.status,
      regionId: regionId || clinic.regionId,
      stateId: stateId || clinic.stateId,
    };

    try {
      clinic = await this.clinicModel.findOneAndUpdate(
        { _id: id },
        {
          $set: updateClinicData,
        },
        { upsert: true },
      );
    } catch (error) {
      throw new InternalServerErrorException('Error in saving DB', error);
    }

    return clinic;
  }
  async createDoctor(
    createDoctorDto: DoctorDto,
    session: ClientSession,
    clinicId: MongooseSchema.Types.ObjectId,
  ): Promise<Doctor> {
    let doctor = await this.doctorModel.findOne({
      samaID: createDoctorDto.samaId,
      clinicId: clinicId,
    });
    try {
      const doctorModel = {
        name: createDoctorDto.name,
        samaID: createDoctorDto.samaId,
        gender: createDoctorDto.gender,
        academicTitle: createDoctorDto.academicTitle,
        medicalDegree: createDoctorDto.medicalDegree,
        phoneNumber: createDoctorDto.phoneNumber,
        clinicId: clinicId,
        status: createDoctorDto.status || true,
      };
      // console.log(createDoctorDto);
      // console.log(doctorModel);
      if (!doctor) {
        doctor = new this.doctorModel(doctorModel);

        doctor = await doctor.save({ session });
      } else {
        doctor = await this.doctorModel.findByIdAndUpdate(
          doctor._id,
          {
            $set: doctorModel,
          },
          { upsert: true },
        );
      }
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException('Error in saving DB', error);
    }
    return doctor;
  }

  async clinicLogin(loginClinicDto: LoginClinicDto) {
    const getUser: any = await this.clinicModel.findOne({
      email: loginClinicDto.email,
      status: true,
    });

    if (getUser) {
      const token = jwt.sign(
        {
          userId: getUser._id,
          userRole: 'CLINIC',
        },
        privateKey,
        {
          algorithm: 'RS256',
          expiresIn: '1d',
        },
      );
      const result = getUser.password
        ? loginClinicDto.password == getUser.password //await bcrypt.compare(loginClinicDto.password, getUser.password)
        : loginClinicDto.password == 'user@123';
      if (!result) throw new UnauthorizedException('password is wrong');
      await this.updateRefreshToken(getUser._id, token);
      return {
        email: getUser.email,
        token,
        userRole: getUser.userRole,
        userId: getUser._id,
      };
    } else {
      throw new NotFoundException('Your account has been deactivated.');
    }
  }
  async scanCouponInfo(couponCode: string) {
    const coupon = await this.couponModel.aggregate([
      {
        $match: {
          couponCode: couponCode,
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
                from: 'coupons',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$userId', '$$id'] },
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
                userId: '$_id',
                name: 1,
                age: 1,
                dateOfBirth: 1,
                geastralMonth: 1,
                noOfChildren: 1,
                phoneNumber: 1,
                couponCount: { $size: '$coupons' },
              },
            },
          ],
          as: 'client',
        },
      },
      {
        $unwind: '$client',
      },
      {
        $project: {
          _id: 0,
          couponCode: 1,
          client: 1,
          status: 1,
        },
      },
    ]);
    if (
      coupon.length &&
      coupon[0].status != 'REDEEMED' &&
      coupon[0].status != 'INACTIVE' &&
      coupon[0].status != 'EXPIRED' &&
      coupon[0].client.couponCount < 3
    ) {
      return {
        ok: true,
        data: coupon[0],
        message: 'Successfully Scanned',
      };
    } else {
      throw coupon.length && coupon[0].client.couponCount > 3
        ? new NotFoundException('You redemeed 3 times.')
        : new NotFoundException('Coupon is expired or something went wrong');
    }
  }
  async redeemedCoupon(token: string, redeemedCouponDto: RedeemedCouponDto) {
    try {
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });
      const { userId } = decoded;
      const updateCouponData = { ...redeemedCouponDto };
      delete updateCouponData.couponCode;
      updateCouponData['clinicId'] = userId;
      updateCouponData['redemeedDate'] = new Date();

      await this.couponModel.findOneAndUpdate(
        { couponCode: redeemedCouponDto.couponCode },
        {
          $set: updateCouponData,
        },
      );
      return { message: `Successfully ${redeemedCouponDto.status}` };
    } catch (error) {
      throw new BadRequestException('Something went wrong');
    }
  }
  async updateRefreshToken(id: string, token: string) {
    try {
      await this.clinicModel.findByIdAndUpdate(id, {
        $set: { refreshToken: token },
      });
      return { message: 'Successfully updated token' };
    } catch (error) {
      throw new InternalServerErrorException('Error in update data DB', error);
    }
  }

  async updateCouponCategory(category: string, couponCode: string) {
    try {
      await this.couponModel.findOneAndUpdate(
        { couponCode },
        {
          $set: { category: category },
        },
      );
      return { message: 'Successfully updated token' };
    } catch (error) {
      throw new InternalServerErrorException('Error in update data DB', error);
    }
  }
  async changePassword(token: string, changePassword: ChangePassword) {
    try {
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });
      const { userId } = decoded;
      const user = await this.clinicModel.findById(userId);
      user.password = changePassword.new_password;
      await user.save();

      return { message: 'Successfully Updated Password' };
      // const result = user.password
      //   ? await bcrypt.compare(changePassword.current_password, user.password)
      //   : changePassword.current_password == 'user@123';
      // console.log(' result ', result);

      // if (result) {
      //   user.password = changePassword.new_password;
      //   await user.save();

      //   return { message: 'Successfully Updated Password' };
      // } else {
      //   throw new BadRequestException('Your current password is wrong');
      // }
    } catch (error) {
      throw new BadRequestException('Something went wrong');
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
