import { IsNotEmpty, IsString, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class GeneateCouponDto {
  @ApiProperty()
  @IsString()
  clinicId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  couponFamilyId: string;

  @ApiProperty()
  @IsDateString()
  validFrom: string;

  @ApiProperty()
  @IsDateString()
  validTo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsArray()
  date: string[];
}
