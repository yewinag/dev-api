import { InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GetQueryDto } from '../dto/getQueryDto';
import { ResponseDto } from '../dto/response.dto';
import { Region } from '../entities/region.model';
import { Model, Types } from 'mongoose';
import { State } from 'src/entities/state.model';
import * as fs from 'fs';

export class StateRegionRespository {
  constructor(
    @InjectModel(Region.name)
    private readonly regionModel: Model<Region>,
    @InjectModel(State.name)
    private readonly stateModel: Model<State>,
  ) {}

  async getRegions(query: GetQueryDto) {
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let regions: Region[];

    try {
      regions = await this.regionModel.aggregate([
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 0,
            regionId: '$_id',
            regionName: 1,
            status: 1,
          },
        },
      ]);
      let response: ResponseDto;

      if (regions.length > 0) {
        response = {
          ok: true,
          data: regions,
          message: 'Get Region Data Success!',
          page,
          limit,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No Region Exist',
          page,
          limit,
        };
      }
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }
  async getStates(query: GetQueryDto, id: string) {
    let page = query.page || 1;
    page = Number(page);

    let limit = query.limit || 10;
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let states: State[];

    try {
      console.log(id);
      states = await this.stateModel.aggregate([
        {
          $match: {
            region: new Types.ObjectId(id),
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 0,
            stateId: '$_id',
            stateName: 1,
            status: 1,
          },
        },
      ]);

      let response: ResponseDto;

      if (states.length > 0) {
        response = {
          ok: true,
          data: states,
          message: 'Get State Data Success!',
          page,
          limit,
        };
      } else {
        response = {
          ok: true,
          data: [],
          message: 'No State Exist',
          page,
          limit,
        };
      }
      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error DB GET', error);
    }
  }

  async createStateRegions() {
    let data: any = fs.readFileSync(process.cwd() + '/db.json', 'utf-8');
    data = JSON.parse(data);
    await Promise.all([
      data.map(async (r: any) => {
        const region = new this.regionModel({
          regionName: r.eng,
        });
        await region.save();
        console.log(region);
        const states = await Promise.all(
          r.districts.map((s) => {
            return { stateName: s.eng, region: region._id };
          }),
        );
        await this.stateModel.insertMany(states);
      }),
    ]);
  }
}
