import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  const config = new DocumentBuilder()
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .setTitle('PSI admin API')
    .setDescription('PSI Admin & Provider')
    .setVersion('0.0.1')
    .addTag('Admin')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);

  await app.listen(9000, '0.0.0.0');
}
bootstrap();
