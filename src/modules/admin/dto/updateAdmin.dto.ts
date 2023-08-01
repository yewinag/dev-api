import { PartialType } from '@nestjs/swagger';
import { CreateAdminDto } from './createAdmin.dto';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
