import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  age: string;

  @ApiProperty()
  @IsBoolean()
  pragrancyStatus: boolean;

  @ApiProperty()
  @IsNumber()
  noOfChildren: number;

  @ApiProperty()
  @IsNumber()
  geastralMonth: number;

  @ApiProperty()
  @IsBoolean()
  status: boolean;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty()
  @IsString()
  stateId: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  township: string;
}
