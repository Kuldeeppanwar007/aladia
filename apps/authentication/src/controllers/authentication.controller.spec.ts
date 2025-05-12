import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '@app/common/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repository/user.repository';

// 👇 Add a mock UserModel
const mockUserModel = {};

describe('AuthenticationController', () => {
  let authenticationController: AuthenticationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        AuthenticationService,
        JwtService,
        ConfigService,
        LoggerService,
        UserRepository,
        {
          provide: 'UserModel', // 👈 this must match the injection token used in UserRepository
          useValue: mockUserModel,
        },
      ],
    }).compile();

    authenticationController = app.get<AuthenticationController>(
      AuthenticationController,
    );
  });

  it('should be defined', () => {
    expect(authenticationController).toBeDefined();
  });
});
