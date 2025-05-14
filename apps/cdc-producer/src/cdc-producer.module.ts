import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersCdcModule } from './orders-cdc/orders-cdc.module';
import { LoggingModule } from '@app/common/core';
import { ConfigModule as MyConfigModule } from '@app/common/config'; // Path to your common config

@Module({
  imports: [
    MyConfigModule, // Includes global NestConfigModule.forRoot
    LoggingModule, // Our common logging module
    MongooseModule.forRootAsync({
      imports: [MyConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('Mongo URI:', configService.get<string>('MONGO_URI'));
        return({
        uri: configService.get<string>('MONGO_URI'),
      })},
      inject: [ConfigService],
    }),
    OrdersCdcModule,
  ],
})
export class CdcProducerModule {}
