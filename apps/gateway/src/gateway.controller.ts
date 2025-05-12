import {
  Controller,
  Post,
  Body,
  Get,
  Inject,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { firstValueFrom, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserResponseRto, LoginResponseRto } from './rto/user-response.rto';
import { LoginUserHttpDto } from './dto/login-user-http.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LoggerService } from '@app/common/core';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor) // To enable RTO transformations (e.g. @Exclude)
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(GatewayController.name);
  }

  private handleMicroserviceError(error: any) {
    this.logger.error(
      `Microservice communication error: ${error.message}`,
      error.stack,
    );
    if (error instanceof TimeoutError) {
      throw new RpcException({
        status: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request to authentication service timed out.',
      });
    }
    // Re-throw RpcException as is, or transform other errors
    if (error.status && error.message) {
      // This assumes RpcException structure
      throw new RpcException({ status: error.status, message: error.message });
    }
    throw new RpcException({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal error occurred with the authentication service.',
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: UserResponseRto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<UserResponseRto> {
    this.logger.log(
      `Gateway: Received registration request for ${registerUserDto.email}`,
    );
    // Map HTTP DTO to internal DTO for the microservice
    const createUserInternalDto = {
      email: registerUserDto.email,
      password: registerUserDto.password,
      name: registerUserDto.name,
    };
    return firstValueFrom(
      this.authClient
        .send<UserResponseRto>({ cmd: 'auth_register' }, createUserInternalDto)
        .pipe(
          timeout(5000), // 5 seconds timeout
          catchError((err) => {
            this.logger.error(
              `Error from auth_register: ${JSON.stringify(err)}`,
            );
            // Transform microservice error (often an RpcException) to HTTP error
            // The RpcException filter in main.ts will handle this.
            return throwError(() => new RpcException(err));
          }),
        ),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login an existing user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT.',
    type: LoginResponseRto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async login(
    @Body() loginUserDto: LoginUserHttpDto,
  ): Promise<LoginResponseRto> {
    this.logger.log(
      `Gateway: Received login request for ${loginUserDto.email}`,
    );
    // DTO mapping if necessary, here it's similar
    return firstValueFrom(
      this.authClient
        .send<LoginResponseRto>({ cmd: 'auth_login' }, loginUserDto)
        .pipe(
          timeout(5000),
          catchError((err) => {
            this.logger.error(`Error from auth_login: ${JSON.stringify(err)}`);
            return throwError(() => new RpcException(err));
          }),
        ),
    );
  }

  @Get('users')
  @UseGuards(JwtAuthGuard) // Protect this route
  @ApiBearerAuth() // Indicates Swagger UI that this endpoint needs Bearer token
  @ApiOperation({ summary: 'Get all users (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
    type: [UserResponseRto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  // @UseInterceptors(CacheInterceptor) // Apply caching to this endpoint
  @CacheKey('all_users') // Custom cache key
  @CacheTTL(30) // Override global TTL: 30 seconds for this endpoint
  async getAllUsers(@Req() req): Promise<UserResponseRto[]> {
    this.logger.log(
      `Gateway: Received request to get all users by ${req.user?.email}`,
    );
    return firstValueFrom(
      this.authClient
        .send<UserResponseRto[]>({ cmd: 'auth_get_users' }, {})
        .pipe(
          timeout(5000),
          catchError((err) => {
            this.logger.error(
              `Error from auth_get_users: ${JSON.stringify(err)}`,
            );
            return throwError(() => new RpcException(err));
          }),
        ),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user profile (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile.',
    type: UserResponseRto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getCurrentUser(@Req() req): UserResponseRto {
    // req.user is populated by JwtAuthGuard
    this.logger.log(`Gateway: Received request for 'me' by ${req.user?.email}`);
    return req.user; // The user object is already validated and attached by JwtStrategy & JwtAuthGuard
  }
}
