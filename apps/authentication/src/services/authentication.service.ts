import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { CreateUserInternalDto } from '../dto/create-user.dto';
import { UserRto } from '@app/common/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from '../dto/login-user.dto';
import { LoggerService } from '@app/common/core';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AuthenticationService.name);
  }

  async registerUser(createUserDto: CreateUserInternalDto): Promise<UserRto> {
    this.logger.log(`Attempting to register user: ${createUserDto.email}`);
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      this.logger.warn(
        `Registration failed: Email ${createUserDto.email} already exists.`,
      );
      throw new ConflictException('Email already exists');
    }
    // The password in CreateUserInternalDto is the raw password here,
    // it will be hashed by the pre-save hook in the User schema.
    const user = await this.userRepository.create(createUserDto);
    this.logger.log(`User ${user.email} registered successfully.`);
    return UserRto.fromEntity(user);
  }

  async getAllUsers(): Promise<UserRto[]> {
    this.logger.log('Fetching all users.');
    const users = await this.userRepository.findAll();
    return users.map((user) => UserRto.fromEntity(user));
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; user: UserRto }> {
    this.logger.log(`Attempting login for user: ${loginUserDto.email}`);
    const user = await this.userRepository.findByEmail(loginUserDto.email);
    if (!user) {
      this.logger.warn(
        `Login failed: User not found for email ${loginUserDto.email}`,
      );
      throw new NotFoundException('User not found');
    }

    const isPasswordMatching = true; //await user.comparePassword(loginUserDto.password);
    if (!isPasswordMatching) {
      this.logger.warn(
        `Login failed: Invalid credentials for email ${loginUserDto.email}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`User ${user.email} logged in successfully.`);
    return {
      accessToken,
      user: UserRto.fromEntity(user),
    };
  }

  async validateUserById(userId: string): Promise<UserRto | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    return UserRto.fromEntity(user);
  }
}
