import { Test, TestingModule } from '@nestjs/testing';
import { CdcProducerController } from './cdc-producer.controller';
import { CdcProducerService } from './cdc-producer.service';

describe('CdcProducerController', () => {
  let cdcProducerController: CdcProducerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CdcProducerController],
      providers: [CdcProducerService],
    }).compile();

    cdcProducerController = app.get<CdcProducerController>(
      CdcProducerController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(cdcProducerController.getHello()).toBe('Hello World!');
    });
  });
});
