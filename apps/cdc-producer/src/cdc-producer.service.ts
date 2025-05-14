import { Injectable } from '@nestjs/common';

@Injectable()
export class CdcProducerService {
  getHello(): string {
    return 'Hello World!';
  }
}
