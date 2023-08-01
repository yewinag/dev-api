import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  familyName: string;

  @ApiProperty()
  @IsString()
  programName: string;

  @ApiProperty()
  @IsString()
  serviceName: string;

  @ApiProperty()
  @IsString()
  programId: string;

  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  noOfCoupons: number;

  @ApiProperty()
  @IsBoolean()
  status: boolean;
}
