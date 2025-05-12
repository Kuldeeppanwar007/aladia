import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule as MyConfigModule } from '@app/common/config';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggingModule, LoggerService } from '@app/common/core';
import { JwtStrategy } from './auth/jwt.strategy'; // We'll create this
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // We'll create this
import { CacheInterceptor } from '@nestjs/cache-manager'; // For caching
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/health.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MyConfigModule,
    LoggingModule,
    PassportModule, // For JWT authentication
    HttpModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE', // Injection token for the microservice client
        imports: [MyConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_MICROSERVICE_HOST'),
            port: configService.get<number>('AUTH_MICROSERVICE_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ThrottlerModule.forRootAsync({
      // Rate Limiting
      imports: [MyConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000), // 60 seconds
          limit: config.get<number>('THROTTLE_LIMIT', 10), // 10 requests
        },
      ],
    }),
    TerminusModule, // For health checks
  ],
  controllers: [GatewayController, HealthController],
  providers: [
    LoggerService, // Provide LoggerService if used directly in controllers/services here
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
    JwtStrategy, // JWT strategy for Passport
    JwtAuthGuard, // Global JWT guard can be set here or per route
    // { // Example for global caching, can also be used per-route
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class GatewayModule {}
