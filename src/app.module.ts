import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config/configuration.service';
import { ConfigModule } from './config/configuration.module';
import { AdminModule } from './modules/admin/admin.module';
import { ClientModule } from './modules/client/client.module';
import { ClinicModule } from './modules/clinic/clinic.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { AppMiddleware } from 'src/app.middleware';
import { StateRegionModule } from 'src/modules/stateregion/state.region.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { User, UserSchema } from './entities/user.model';
import { Clinic, ClinicSchema } from './entities/clinic.model';
import { CommonRespository } from './repositories/common.respository';
import { Client, ClientSchema } from './entities/client.model';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.getMongoConfig(),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Clinic.name, schema: ClinicSchema }]),
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    AdminModule,
    ClientModule,
    ClinicModule,
    CouponModule,
    StateRegionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, CommonRespository],
  exports: [AppService, CommonRespository],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppMiddleware)
      .exclude('admin/login')
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // apply on all routes
  }
}
