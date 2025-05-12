import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, // e.g., .env.development, .env.production
      ignoreEnvFile: process.env.NODE_ENV === 'production', // Don't load .env file in production if vars are set otherwise
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
