import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemedCouponDto {
  @IsString()
  @IsNotEmpty()
  couponCode: string;

  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  doctorComment: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
