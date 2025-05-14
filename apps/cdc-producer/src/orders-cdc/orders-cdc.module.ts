import { Module } from '@nestjs/common';
import { OrdersCdcService } from './orders-cdc.service';

@Module({
  providers: [OrdersCdcService], // MongooseConnection and ConfigService are globally available or imported in AppModule
})
export class OrdersCdcModule {}
