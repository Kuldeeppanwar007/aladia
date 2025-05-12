import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@app/common/core';
import { RpcExceptionFilter } from './filters/rpc-exception.filter'; // Import the filter

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    // To use our custom logger globally for HTTP requests
    // logger: new LoggerService(new ConfigService()), // Resolve properly or use app.get after creation
  });
  const configService = await app.resolve(ConfigService);
  const customLogger = await app.resolve(LoggerService); // Get instance of your logger
  app.useLogger(customLogger); // Use custom logger for Nest HTTP app

  app.setGlobalPrefix('api'); // Optional: Prefix all routes with /api

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // Global Filters
  app.useGlobalFilters(new RpcExceptionFilter()); // Apply RPC exception filter

  // Global Interceptors (ClassSerializerInterceptor is good for RTOs like UserResponseRto)
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );

  // Swagger (OpenAPI) Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Monorepo API Gateway')
    .setDescription('API documentation for the monorepo gateway')
    .setVersion('1.0')
    .addBearerAuth() // For JWT
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Users', 'User management (example)') // If you add more user-related endpoints
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document); // Swagger UI at /api/docs

  const port = configService.get<number>('GATEWAY_PORT') || 3000;
  await app.listen(port);
  customLogger.log(
    `Gateway is running on: http://localhost:${port}/api`,
    'BootstrapGateway',
  );
  customLogger.log(
    `Swagger UI available at http://localhost:${port}/api/docs`,
    'BootstrapGateway',
  );
}
bootstrap();
