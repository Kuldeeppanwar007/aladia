import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ConfigModule } from '@app/common/config';

@Global() // Make LoggerService globally available
@Module({
  imports: [ConfigModule], // Import ConfigModule to use ConfigService
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggingModule {}
