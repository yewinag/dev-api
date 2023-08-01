import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../entities/user.model';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRespository } from 'src/repositories/admin.respository';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRespository],
  exports: [AdminService, AdminRespository],
})
export class AdminModule {}
