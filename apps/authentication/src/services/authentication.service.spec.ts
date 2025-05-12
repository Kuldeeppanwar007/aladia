/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { UserRepository } from '../repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserInternalDto } from '../dto/create-user.dto';
import { UserRto } from '@app/common/core/rto/user.rto';
import { LoggerService } from '@app/common/core'; // Mock this

// Mock concrete implementation for LoggerService
class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  setContext = jest.fn();
}

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userRepository: UserRepository;
  let jwtService: JwtService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'testsecret';
      if (key === 'JWT_EXPIRATION') return '1h';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useClass: MockLoggerService }, // Provide mock
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const createUserDto: CreateUserInternalDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };
    const mockUser = {
      _id: 'someId',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.registerUser(createUserDto);
      expect(result).toBeInstanceOf(UserRto);
      expect(result.email).toEqual(createUserDto.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          password: createUserDto.password, // Service passes raw password to repo
          name: createUserDto.name,
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      await expect(service.registerUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getAllUsers', () => {
    const mockUsers = [
      {
        _id: 'id1',
        email: 'user1@example.com',
        name: 'User One',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'id2',
        email: 'user2@example.com',
        name: 'User Two',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any[];

    it('should return an array of users', async () => {
      mockUserRepository.findAll.mockResolvedValue(mockUsers);
      const result = await service.getAllUsers();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserRto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result[0].email).toBe(mockUsers[0].email);
    });
  });

  // Add more tests for login, validateUserById etc.
});
