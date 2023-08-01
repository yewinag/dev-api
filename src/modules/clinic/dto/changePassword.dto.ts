import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePassword {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @IsNotEmpty()
  new_password: string;
}
