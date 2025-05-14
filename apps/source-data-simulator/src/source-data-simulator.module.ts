import { Module } from '@nestjs/common';
import { SourceDataSimulatorController } from './source-data-simulator.controller';
import { SourceDataSimulatorService } from './source-data-simulator.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule as MyConfigModule } from '@app/common/config'; // Path to your common config
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from './orders/orders.module';
import { LoggingModule } from '@app/common/core';

@Module({
  imports: [
    MyConfigModule, // Includes global NestConfigModule.forRoot
    LoggingModule, // Our common logging module
    MongooseModule.forRootAsync({
      imports: [MyConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    OrdersModule,
  ],
  controllers: [SourceDataSimulatorController],
  providers: [SourceDataSimulatorService],
})
export class SourceDataSimulatorModule {}
