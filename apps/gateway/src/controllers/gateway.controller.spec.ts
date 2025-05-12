import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from '../controllers/gateway.controller';
import { GatewayService } from '../services/gateway.service';

describe('GatewayController', () => {
  let gatewayController: GatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [GatewayService],
    }).compile();

    gatewayController = app.get<GatewayController>(GatewayController);
  });

  it('should be defined', () => {
    expect(gatewayController).toBeDefined();
  });
});
