import { Test, TestingModule } from '@nestjs/testing';
import { SourceDataSimulatorController } from './source-data-simulator.controller';
import { SourceDataSimulatorService } from './source-data-simulator.service';

describe('SourceDataSimulatorController', () => {
  let sourceDataSimulatorController: SourceDataSimulatorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SourceDataSimulatorController],
      providers: [SourceDataSimulatorService],
    }).compile();

    sourceDataSimulatorController = app.get<SourceDataSimulatorController>(
      SourceDataSimulatorController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(sourceDataSimulatorController.getHello()).toBe('Hello World!');
    });
  });
});
