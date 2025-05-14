import { Controller, Get } from '@nestjs/common';
import { CdcProducerService } from './cdc-producer.service';

@Controller()
export class CdcProducerController {
  constructor(private readonly cdcProducerService: CdcProducerService) {}

  @Get()
  getHello(): string {
    return this.cdcProducerService.getHello();
  }
}
