import { IsOptional } from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';

export class GetQueryDto {
  @IsOptional()
  id: MongooseSchema.Types.ObjectId;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  searchColumn?: string;

  @IsOptional()
  search?: string;

  @IsOptional()
  startDate: string;

  @IsOptional()
  endDate: string;

  @IsOptional()
  state: string;

  @IsOptional()
  region: string;

  @IsOptional()
  redemeedStatus: boolean;

  @IsOptional()
  couponStatus: string;

  @IsOptional()
  type: string;
}
