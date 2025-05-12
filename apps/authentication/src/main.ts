import { NestFactory } from '@nestjs/core';
import { AuthenticationModule } from './authentication.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@app/common/core'; // Import your common LoggerService

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    AuthenticationModule,
    {
      // Buffer logs until custom logger is ready, or use a basic console logger first
    },
  );
  const configService = appContext.get(ConfigService);
  const customLogger = await appContext.resolve(LoggerService); // Get instance of your logger

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthenticationModule,
    {
      transport: Transport.TCP,
      options: {
        host: configService.get<string>('AUTH_MICROSERVICE_HOST'),
        port: configService.get<number>('AUTH_MICROSERVICE_PORT'),
      },
      // Use the custom logger for the microservice
      logger: customLogger,
    },
  );
  appContext.close(); // Close the context used to fetch config/logger

  await app.listen();
  customLogger.log(
    `Authentication microservice is running on host ${configService.get<string>('AUTH_MICROSERVICE_HOST')} and port ${configService.get<number>('AUTH_MICROSERVICE_PORT')}`,
    'BootstrapAuth',
  );
}
bootstrap();
