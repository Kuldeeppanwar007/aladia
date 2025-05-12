import { Module } from '@nestjs/common';
import { coreService } from './core.service';

@Module({
  providers: [coreService],
  exports: [coreService],
})
export class coreModule {}
