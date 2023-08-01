import { IsNotEmpty, IsString } from 'class-validator';

export class CouponScanDto {
  @IsString()
  @IsNotEmpty()
  couponCode: string;
}
