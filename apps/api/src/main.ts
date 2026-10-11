import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Krypton School ERP API')
    .setDescription('Multi-tenant school management system API for Kenyan schools')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('platform', 'Platform administration')
    .addTag('students', 'Student management')
    .addTag('guardians', 'Guardian management')
    .addTag('fees', 'Fee management')
    .addTag('payments', 'Payment management')
    .addTag('mpesa', 'M-Pesa integration')
    .addTag('attendance', 'Attendance tracking')
    .addTag('examinations', 'Examination management')
    .addTag('staff', 'Staff management')
    .addTag('communications', 'Communications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  console.log('🚀 Krypton School ERP API is running');
  console.log(`📍 Application: http://localhost:${port}`);
  console.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();
