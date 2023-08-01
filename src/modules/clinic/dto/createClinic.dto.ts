import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClinicDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clinicJoinDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clinicName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  doctors: [];

  @ApiProperty()
  @IsBoolean()
  status: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  township: string;
}
