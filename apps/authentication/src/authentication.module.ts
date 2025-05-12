import { Module } from '@nestjs/common';
import { AuthenticationController } from './controllers/authentication.controller';
import { AuthenticationService } from './services/authentication.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repository/user.repository';
import { ConfigModule as MyConfigModule } from '@app/common/config'; // Path to your common config
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggingModule } from '@app/common/core'; // Path to your common logging
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    MyConfigModule, // Our common config module
    LoggingModule, // Our common logging module
    MongooseModule.forRootAsync({
      imports: [MyConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [MyConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
    TerminusModule, // For health checks
  ],
  controllers: [AuthenticationController, HealthController], // Will handle incoming messages
  providers: [AuthenticationService, UserRepository],
})
export class AuthenticationModule {}
