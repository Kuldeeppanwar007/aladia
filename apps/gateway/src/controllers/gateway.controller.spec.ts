import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from '../controllers/gateway.controller';
import { GatewayService } from '../services/gateway.service';
import { LoggerService } from '@app/common/core';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';

describe('GatewayController', () => {
  let gatewayController: GatewayController;

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn().mockReturnValue('mocked-value'),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        GatewayService,
        LoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService, // Use mocked ConfigService here
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: CacheInterceptor,
        },
        {
          provide: 'AUTH_SERVICE', // Mock AUTH_SERVICE
          useValue: {
            someMethod: jest.fn().mockReturnValue({}), // Example mock method
          },
        },
        {
          provide: CACHE_MANAGER, // Mock CACHE_MANAGER
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    gatewayController = app.get<GatewayController>(GatewayController);
  });

  it('should be defined', () => {
    expect(gatewayController).toBeDefined();
  });
});
