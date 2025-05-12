/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Inject } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  TcpContext,
} from '@nestjs/microservices';
import { AuthenticationService } from '../services/authentication.service';
import { CreateUserInternalDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto'; // Ensure this DTO is created
import { LoggerService } from '@app/common/core';

@Controller()
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AuthenticationController.name);
  }

  @MessagePattern({ cmd: 'auth_register' })
  async registerUser(
    @Payload() data: CreateUserInternalDto,
    @Ctx() context: TcpContext,
  ) {
    this.logger.log(
      `Received message for 'auth_register': ${JSON.stringify(data.email)}`,
    );
    // Note: Error handling (e.g., via RpcException filters) should be added for microservices
    try {
      return await this.authenticationService.registerUser(data);
    } catch (error) {
      this.logger.error(
        `Error in auth_register: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to be caught by NestJS microservice error handling or client
    }
  }

  @MessagePattern({ cmd: 'auth_get_users' })
  async getAllUsers(@Ctx() context: TcpContext) {
    this.logger.log(`Received message for 'auth_get_users'`);
    try {
      return await this.authenticationService.getAllUsers();
    } catch (error) {
      this.logger.error(
        `Error in auth_get_users: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @MessagePattern({ cmd: 'auth_login' })
  async login(@Payload() data: LoginUserDto, @Ctx() context: TcpContext) {
    this.logger.log(
      `Received message for 'auth_login': ${JSON.stringify(data.email)}`,
    );
    try {
      return await this.authenticationService.login(data);
    } catch (error) {
      this.logger.error(`Error in auth_login: ${error.message}`, error.stack);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'auth_validate_user' })
  async validateUser(
    @Payload() data: { userId: string },
    @Ctx() context: TcpContext,
  ) {
    this.logger.log(
      `Received message for 'auth_validate_user': userId=${data.userId}`,
    );
    try {
      return await this.authenticationService.validateUserById(data.userId);
    } catch (error) {
      this.logger.error(
        `Error in auth_validate_user: ${error?.message || error}`,
        error.stack,
      );
      throw error;
    }
  }
}
