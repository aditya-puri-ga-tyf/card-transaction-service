import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { ApiErrorResponse } from './types/api-response.types';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  const baseUrl = configService.get<string>('BASE_URL') || `http://localhost:${port}`;

  // Security
  app.use(helmet());

  // CORS
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Configure Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Card Transaction API')
    .setDescription('Card Transaction REST API Documentation')
    .setVersion('1.0')
    .addTag('transactions')
    .addApiKey(
      { 
        type: 'apiKey',
        name: 'x-user-id',
        in: 'header',
        description: 'User ID for authentication'
      },
      'x-user-id'
    )
    .addServer(baseUrl, 'Local development')
    .build();

  const filePath = 'swagger.json';
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ApiErrorResponse], // Globally register error response model
  });

  // Write swagger json file
  fs.writeFileSync(filePath, JSON.stringify(document, null, 2));

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    },
    customSiteTitle: 'Card Transaction API Documentation'
  });

  // Handle favicon.ico requests
  app.getHttpAdapter().get('/favicon.ico', (req, res: Response) => res.status(204).end());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  await app.listen(port);
  console.log(`Application is running on: ${baseUrl}/api`);
  console.log(`Swagger documentation: ${baseUrl}/api/docs`);
}
bootstrap();
